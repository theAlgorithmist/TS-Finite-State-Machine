"use strict";
/**
 * Copyright 2018 Jim Armstrong (www.algorithmist.net)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var Subject_1 = require("rxjs/Subject");
/**
 * A reactive (Mealy) Finite State Machine that is designed to be driven by Object data that itself is likely metadata
 * in a larger collection.  While the architecture is Mealy, Moore-style machines may also be used.  It is possible to
 * exercise class methods directly, although typical use is to create a machine directly from teh static factory
 * ({create}) or construct machine and then later initialize it through the {fromJson()} method.
 * <br/>
 * <br/>
 * While transition functions may be defined in Object data, they should be pure and small.  Pay particular attention
 * to scope and do not use the self-referential pointer (this) inside any such function.  Refer to the specs in the
 * test folder that accompanies this distribution for detailed usage examples.
 * <br/>
 * <br/>
 * The machine is initialized in the {NO_STATE} state by default.  If no initial state is defined in data, it is
 * customary to indicate the initial state by using the optional argument in the {next()} function.
 * <br/>
 * <br/>
 * NOTE: This implementation depends on ES6 Map and Set.
 *
 * @author Jim Armstrong (www.algorithmist.net)
 *
 * @version 1.0
 */
var FiniteStateMachine = (function () {
    function FiniteStateMachine() {
        this.name = '';
        this._curState = FiniteStateMachine.NO_STATE;
        this._states = new Set();
        this._transitions = new Map();
        this._subject = new Subject_1.Subject();
        this._subscriptions = new Array();
        this._initialState = FiniteStateMachine.NO_STATE;
        this._initialData = null;
        this._alphabet = null;
    }
    /**
     * Create a new FSM
     *
     * @param {Object} data Object description of this machine
     *
     * @param {string} name Machine name
     *
     * @returns {FiniteStateMachine | null} A null return indicates invalid data
     */
    FiniteStateMachine.create = function (data, name) {
        if (data !== undefined && data != null) {
            var machine = new FiniteStateMachine();
            var result = machine.fromJson(data);
            if (result.success) {
                machine.name = name !== undefined ? name : '';
                return machine;
            }
        }
        return null;
    };
    Object.defineProperty(FiniteStateMachine.prototype, "numStates", {
        /**
         * Access the number of states defined for this machine
         *
         * @returns {number}
         */
        get: function () {
            return this._states.size;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FiniteStateMachine.prototype, "numTransitions", {
        /**
         * Access the number of state transitions defined for this machine
         *
         * @returns {number}
         */
        get: function () {
            return this._transitions.size;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FiniteStateMachine.prototype, "currentState", {
        /**
         * Access the current state of this machine
         *
         * @returns {string}
         */
        get: function () {
            return this._curState;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FiniteStateMachine.prototype, "states", {
        /**
         * Access the named states in this machine in the order they were defined
         *
         * @returns {IterableIterator<string>}
         */
        get: function () {
            return this._states.keys();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FiniteStateMachine.prototype, "initialState", {
        /**
         * Access the initial state of this machine
         *
         * @returns {string} This is ONLY relevant for a machine defined by {Object} data
         */
        get: function () {
            return this._initialState;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FiniteStateMachine.prototype, "initialData", {
        /**
         * Access initial data associated with the definition of this machine
         *
         * @returns {Object} This is ONLY relevant for a machine defined by {Object} data
         */
        get: function () {
            return this._initialData ? JSON.parse(JSON.stringify(this._initialData)) : null;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FiniteStateMachine.prototype, "isAcceptance", {
        /**
         * Access whether or not this machine is currently in an acceptance state
         *
         * @returns {boolean}
         */
        get: function () {
            return this._acceptanceStates ? this._acceptanceStates.hasOwnProperty(this._curState) : false;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FiniteStateMachine.prototype, "alphabet", {
        /**
         * Access the alphabet defined for this machine.
         *
         * @returns {Array<string>} This is ONLY relevant for a machine defined by {Object} data
         */
        get: function () {
            return this._alphabet.slice();
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Initialize this machine from {Object} data
     *
     * @param {Object} data Data definition of this machine (must include 'name', 'alphabet', and 'states' properties
     *
     * @returns {IDecisionTreeAction} Result of data definition.  The 'success' property will be true and the 'action'
     * property will be 'VALID' for valid machine data
     */
    FiniteStateMachine.prototype.fromJson = function (data) {
        if (data === undefined || data == null) {
            return {
                success: false,
                action: FiniteStateMachine.NO_DATA
            };
        }
        // test required states
        if (!data.hasOwnProperty('name') || !data.hasOwnProperty('alphabet') || !data.hasOwnProperty('states')) {
            return {
                success: false,
                action: FiniteStateMachine.MISSING_PROPS
            };
        }
        var tmp = data['alphabet'];
        if (Object.prototype.toString.call(tmp) == '[object Array]') {
            // good to go
            this._alphabet = data['alphabet'].slice();
        }
        else {
            return {
                success: false,
                action: FiniteStateMachine.INVALID_DATA
            };
        }
        tmp = data['states'];
        var states;
        if (Object.prototype.toString.call(tmp) == '[object Array]') {
            states = data['states'];
            if (states.length == 0) {
                return {
                    success: false,
                    action: FiniteStateMachine.NO_STATE
                };
            }
        }
        else {
            return {
                success: false,
                action: FiniteStateMachine.INVALID_DATA
            };
        }
        this.name = data['name'];
        this._initialState = data.hasOwnProperty('initialState') ? data['initialState'] : FiniteStateMachine.NO_STATE;
        this._curState = this._initialState;
        // process the states
        var n = states.length;
        var i;
        var state;
        for (i = 0; i < n; ++i) {
            state = states[i];
            // TODO - work over error handling and apply transition function variable-check
            if (state.hasOwnProperty('name') && state.hasOwnProperty('isAcceptance') && state.hasOwnProperty('transition')) {
                var name_1 = state['name'];
                var fcn = new Function('data', 'state', state['transition']);
                // TODO insert fcn-check here ...
                this.addState(name_1, state['isAcceptance']);
                this.addTransition(name_1, fcn);
            }
            else {
                return {
                    success: false,
                    action: FiniteStateMachine.INVALID_DATA,
                    node: state
                };
            }
        }
        // any initial data provided?
        if (data.hasOwnProperty('initialData')) {
            var tmp_1 = data['initialData'];
            if (tmp_1 !== undefined && Object.prototype.toString.call(tmp_1) == '[object Object]') {
                this._initialData = JSON.parse(JSON.stringify(tmp_1));
            }
            else {
                return {
                    success: false,
                    action: FiniteStateMachine.INVALID_DATA,
                    node: tmp_1
                };
            }
        }
        return {
            success: true,
            action: FiniteStateMachine.VALID
        };
    };
    /**
     * Add a named state to this machine
     *
     * @param {string} stateName State name
     *
     * @param {boolean} acceptance True if this is an acceptance state for the machine
     */
    FiniteStateMachine.prototype.addState = function (stateName, acceptance) {
        if (acceptance === void 0) { acceptance = false; }
        if (stateName !== undefined && stateName != '') {
            this._states.add(stateName);
            if (acceptance) {
                this._acceptanceStates = this._acceptanceStates || {};
                this._acceptanceStates[stateName] = true;
            }
        }
    };
    /**
     * Add a transition from a named state to this machine
     *
     * @param {string} from Name of the 'from' state
     *
     * @param {transFunction} to Function that computes the next transition state and any associated data
     *
     * @returns {boolean} True if the addition was successful.  Repeat 'from' names are not allowed and will result
     * in an error.
     */
    FiniteStateMachine.prototype.addTransition = function (from, to) {
        // does the from state exist?
        var hasFrom = this._states.has(from);
        if (!hasFrom) {
            return false;
        }
        // has a transition already been defined?
        if (this._transitions.has(from)) {
            return false;
        }
        // add the transition
        this._transitions.set(from, to);
        return true;
    };
    /**
     * Add a subscriber to observe state transitions
     *
     * @param {Observer<IStateTransition>} observer
     *
     * @returns {nothing}
     */
    FiniteStateMachine.prototype.addSubscriber = function (observer) {
        if (observer !== undefined && observer != null) {
            this._subscriptions.push(this._subject.subscribe(observer));
        }
    };
    /**
     * Transition to the next state based on current state and input data
     *
     * @param input Input data or may be a prior state name for a Moore-style machine
     *
     * @param {string} initialState The initial state to use for the machine
     *
     * @returns {IStateOutput | null}
     */
    FiniteStateMachine.prototype.next = function (input, initialState) {
        if (initialState !== undefined && initialState != '') {
            this._curState = initialState;
        }
        var transFcn = this._transitions.get(this._curState);
        if (transFcn !== undefined) {
            var toState = transFcn(input, this._curState);
            // transition to that state and notify observers
            this._subject.next({
                from: this._curState,
                to: toState.to,
                data: toState.data ? toState.data : null
            });
            this._curState = toState.to;
            return {
                to: this._curState,
                data: toState.data ? toState.data : input
            };
        }
        return null;
    };
    /**
     * Clear this machine and prepare for new data
     *
     * @returns {nothing} The only machine parameter that remains unaltered is the name.  The machine is set to the
     * {NO_STATE} state.
     */
    FiniteStateMachine.prototype.clear = function () {
        this._states.clear();
        this._transitions.clear();
        this._subscriptions.forEach(function (sub) { sub.unsubscribe(); });
        this._subscriptions.length = 0;
        this._subject = new Subject_1.Subject();
        this._curState = FiniteStateMachine.NO_STATE;
        this._acceptanceStates = null;
        this._initialState = FiniteStateMachine.NO_STATE;
        this._initialData = null;
        this._alphabet = null;
    };
    FiniteStateMachine.NO_STATE = '[FSM] NO_STATE';
    FiniteStateMachine.NO_DATA = '[FSM] NO_DATA';
    FiniteStateMachine.VALID = '[FSM] DATA_VALID';
    FiniteStateMachine.MISSING_PROPS = '[FSM] MISSING_PROPS';
    FiniteStateMachine.INVALID_DATA = '[FSM] INVALID_DATA';
    return FiniteStateMachine;
}());
exports.FiniteStateMachine = FiniteStateMachine;
