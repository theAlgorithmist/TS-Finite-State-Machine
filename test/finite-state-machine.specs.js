"use strict";
/**
 * Copyright 2016 Jim Armstrong (www.algorithmist.net)
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
// Finite State Machine
var FiniteStateMachine_1 = require("../src/FiniteStateMachine");
var Chai = require("chai");
var expect = Chai.expect;
// Test Suites
describe('Finite State Machine', function () {
    var DIRECTION = '';
    var PAYMENT_COMPLETE = '';
    // We can get away with this in the context of this test environment, but this will not work inside data-defined functions.
    var COIN_VALUE = {
        p: 0.01,
        n: 0.05,
        d: 0.1,
        q: 0.25
    };
    var ELEVATOR_UP = '[Elevator] Up';
    var ELEVATOR_DN = '[Elevator] Down';
    // pre-defined transition functions for various machines; most of these are from internet and texbook
    // examples - you will find them almost anywhere in the literature.  These functions have room for
    // expansion, but could be compacted if they are never extended beyond current use.  That is left as
    // an exercise.
    // binary sequence with an even number of zeros (note that it is not absolutely required to include the 'state' argument)
    var f1 = function (data) {
        return data == 1 ? { to: 'S1' } : (data == 0 ? { to: 'S2' } : { to: 'S1' });
    };
    var f2 = function (data) {
        return data == 1 ? { to: 'S2' } : (data == 0 ? { to: 'S1' } : { to: 'S2' });
    };
    // string generator from alphabet (a, b, c, d)
    var f12 = function (data) {
        return data == 'a' ? { to: 'S2' } : { to: 'S1' };
    };
    var f22 = function (data) {
        return data == 'a' ? { to: 'S2' } : (data == 'b' ? { to: 'S1' } : (data == 'c' ? { to: 'S4' } : { to: 'S2' }));
    };
    var f32 = function (data) {
        return data == 'a' ? { to: 'S1' } : (data == 'b' ? { to: 'S4' } : { to: 'S3' });
    };
    var f42 = function (data) {
        return data == 'd' ? { to: 'S3' } : { to: 'S4' };
    };
    // all binary sequences that end with a 1
    var f13 = function (data) {
        return data == 0 ? { to: 'S1' } : (data == 1 ? { to: 'S2' } : { to: 'S1' });
    };
    var f23 = function (data) {
        return data == 1 ? { to: 'S2' } : (data == 0 ? { to: 'S1' } : { to: 'S2' });
    };
    // elevator between two floors
    var f14 = function (data) {
        return data == 'UP' ? { to: 'FIRST' } : (data == 'DOWN' ? { to: 'GROUND' } : { to: 'GROUND' });
    };
    var f24 = function (data) {
        return data == 'DOWN' ? { to: 'GROUND' } : (data == 'UP' ? { to: 'FIRST' } : { to: 'FIRST' });
    };
    var payola = function (pmt, state) {
        var leftOver = pmt.amt - COIN_VALUE[state];
        var to = leftOver > 0.001 ? state : 'c';
        pmt.amt = leftOver > 0.001 ? leftOver : 0;
        pmt.change = leftOver <= 0.001 ? Math.abs(leftOver) : 0;
        pmt[state]++;
        return {
            to: to,
            data: pmt
        };
    };
    // data descriptions of two machines (initialState and initialData are optional)
    var machine1 = {
        name: 'StringTest',
        initialState: "S1",
        alphabet: [
            'a',
            'b',
            'c',
            'd'
        ],
        states: [
            {
                name: 'S1',
                isAcceptance: false,
                transition: "return data == 'a' ? {to: 'S2'} : {to: 'S1'}"
            },
            {
                name: 'S2',
                isAcceptance: false,
                transition: "return data == 'a' ? {to: 'S2'} : (data == 'b' ? {to: 'S1'} : (data == 'c' ? {to: 'S4'} : {to: 'S2'}))"
            },
            {
                name: 'S3',
                isAcceptance: false,
                transition: "return data == 'a' ? {to: 'S1'} : (data == 'b' ? {to: 'S4'} : {to: 'S3'})"
            },
            {
                name: 'S4',
                isAcceptance: true,
                transition: "return data == 'd' ? {to: 'S3'} : {to: 'S4'}"
            },
        ]
    };
    // initial state is not important in this example.  Note that we can't use the COIN_VALUE helper since the
    // execution context of the dynamic functions is different
    var machine2 = {
        name: 'ChangeMachine',
        alphabet: [
            'p',
            'n',
            'd',
            'q',
        ],
        states: [
            {
                name: 'p',
                isAcceptance: false,
                transition: "const value = state == 'p' ? 0.01 : (state == 'n' ? 0.05 : (state == 'd' ? 0.1 : 0.25));" +
                    "const leftOver = data['amt'] - value;" +
                    "const to = leftOver > 0.001 ? state : 'c';" +
                    "data['amt'] = leftOver > 0.001 ? leftOver : 0;" +
                    "data['change'] = leftOver <= 0.001 ? Math.abs(leftOver) : 0;" +
                    "data[state]++; return {to: to, data: data};"
            },
            {
                name: 'n',
                isAcceptance: false,
                transition: "const value = state == 'p' ? 0.01 : (state == 'n' ? 0.05 : (state == 'd' ? 0.1 : 0.25));" +
                    "const leftOver = data['amt'] - value;" +
                    "const to = leftOver > 0.001 ? state : 'c';" +
                    "data['amt'] = leftOver > 0.001 ? leftOver : 0;" +
                    "data['change'] = leftOver <= 0.001 ? Math.abs(leftOver) : 0;" +
                    "data[state]++; return {to: to, data: data};"
            },
            {
                name: 'd',
                isAcceptance: false,
                transition: "const value = state == 'p' ? 0.01 : (state == 'n' ? 0.05 : (state == 'd' ? 0.1 : 0.25));" +
                    "const leftOver = data['amt'] - value;" +
                    "const to = leftOver > 0.001 ? state : 'c';" +
                    "data['amt'] = leftOver > 0.001 ? leftOver : 0;" +
                    "data['change'] = leftOver <= 0.001 ? Math.abs(leftOver) : 0;" +
                    "data[state]++; return {to: to, data: data};"
            },
            {
                name: 'q',
                isAcceptance: false,
                transition: "const value = state == 'p' ? 0.01 : (state == 'n' ? 0.05 : (state == 'd' ? 0.1 : 0.25));" +
                    "const leftOver = data['amt'] - value;" +
                    "const to = leftOver > 0.001 ? state : 'c';" +
                    "data['amt'] = leftOver > 0.001 ? leftOver : 0;" +
                    "data['change'] = leftOver <= 0.001 ? Math.abs(leftOver) : 0;" +
                    "data[state]++; return {to: to, data: data};"
            },
            {
                name: 'c',
                isAcceptance: true,
                transition: "" // there is never a transition out of the 'complete' state
            },
        ],
        initialData: {
            p: 0,
            n: 0,
            d: 0,
            q: 0,
            amt: 0.68,
            change: 0
        }
    };
    var __machine = new FiniteStateMachine_1.FiniteStateMachine();
    it('properly constructs a new state machine', function () {
        var fsm = new FiniteStateMachine_1.FiniteStateMachine();
        expect(fsm.numStates).to.equal(0);
        expect(fsm.numTransitions).to.equal(0);
        expect(fsm.currentState).to.equal(FiniteStateMachine_1.FiniteStateMachine.NO_STATE);
        expect(fsm.isAcceptance).to.be.false;
    });
    it('no data returns false when initializing FSM', function () {
        var action = __machine.fromJson(null);
        expect(action.success).to.be.false;
        expect(action.action).to.equal(FiniteStateMachine_1.FiniteStateMachine.NO_DATA);
    });
    it('next() returns null for empty machine', function () {
        expect(__machine.next({})).to.be.null;
    });
    it('addState() results in correct state count', function () {
        __machine.addState('STATE1');
        expect(__machine.numStates).to.equal(1);
        __machine.addState('STATE2');
        expect(__machine.numStates).to.equal(2);
        __machine.addState('STATE3');
        expect(__machine.numStates).to.equal(3);
    });
    it('iteration over states works', function () {
        __machine.addState('STATE1');
        __machine.addState('STATE2');
        __machine.addState('STATE3');
        var stateItr = __machine.states;
        expect(stateItr.next().value).to.equal('STATE1');
        expect(stateItr.next().value).to.equal('STATE2');
        expect(stateItr.next().value).to.equal('STATE3');
    });
    it('clear/redundant state test', function () {
        __machine.clear();
        expect(__machine.numStates).to.equal(0);
        __machine.addState('STATE1');
        __machine.addState('STATE1');
        __machine.addState('STATE1');
        expect(__machine.numStates).to.equal(1);
    });
    it('addTransition() results false for non-existent states', function () {
        __machine.clear();
        expect(__machine.addTransition('s1', function (from) {
            return { to: 's2' };
        })).to.be.false;
        __machine.addState('STATE1');
        __machine.addState('STATE2');
        expect(__machine.numStates).to.equal(2);
    });
    it('addTransition() results in correct transition count', function () {
        __machine.clear();
        __machine.addState('STATE1');
        __machine.addState('STATE2');
        __machine.addState('STATE3');
        __machine.addState('STATE4');
        expect(__machine.numStates).to.equal(4);
        expect(__machine.addTransition('STATE1', function (from) {
            return { to: 'STATE4' };
        })).to.be.true;
        expect(__machine.numTransitions).to.equal(1);
        expect(__machine.addTransition('STATE4', function (from) {
            return { to: 'STATE2' };
        })).to.be.true;
        expect(__machine.numTransitions).to.equal(2);
        expect(__machine.addTransition('STATE2', function (from) {
            return { to: 'STATE3' };
        })).to.be.true;
        expect(__machine.numTransitions).to.equal(3);
        expect(__machine.addTransition('STATE3', function (from) {
            return { to: 'STATE1' };
        })).to.be.true;
        expect(__machine.numTransitions).to.equal(4);
    });
    it('machine test #1', function () {
        // does a binary number contain an even number of zeros?
        __machine.clear();
        __machine.addState('S1', true); // this is the machine's singleton acceptance state
        __machine.addState('S2');
        expect(__machine.numStates).to.equal(2);
        expect(__machine.addTransition('S1', f1)).to.be.true;
        expect(__machine.numTransitions).to.equal(1);
        expect(__machine.addTransition('S2', f2)).to.be.true;
        expect(__machine.numTransitions).to.equal(2);
        var binary = [1, 0];
        var n = binary.length;
        var i;
        var state = __machine.next(binary[0], 'S1');
        for (i = 1; i < n; ++i) {
            state = __machine.next(binary[i]);
        }
        expect(state.to).to.equal('S2');
        expect(__machine.isAcceptance).to.be.false;
        binary = [0, 1];
        state = __machine.next(binary[0], 'S1');
        for (i = 1; i < n; ++i) {
            state = __machine.next(binary[i]);
        }
        expect(state.to).to.equal('S2');
        expect(__machine.isAcceptance).to.be.false;
        binary = [0, 1, 0];
        n = binary.length;
        state = __machine.next(binary[0], 'S1');
        for (i = 1; i < n; ++i) {
            state = __machine.next(binary[i]);
        }
        expect(state.to).to.equal('S1');
        expect(__machine.isAcceptance).to.be.true;
        binary = [0, 1, 0, 1];
        n = binary.length;
        state = __machine.next(binary[0], 'S1');
        for (i = 1; i < n; ++i) {
            state = __machine.next(binary[i]);
        }
        expect(state.to).to.equal('S1');
        expect(__machine.isAcceptance).to.be.true;
        binary = [1, 0, 1, 1, 1, 0];
        n = binary.length;
        state = __machine.next(binary[0], 'S1');
        for (i = 1; i < n; ++i) {
            state = __machine.next(binary[i]);
        }
        expect(state.to).to.equal('S1');
        expect(__machine.isAcceptance).to.be.true;
        binary = [0, 0, 0];
        n = binary.length;
        state = __machine.next(binary[0], 'S1');
        for (i = 1; i < n; ++i) {
            state = __machine.next(binary[i]);
        }
        expect(state.to).to.equal('S2');
        expect(__machine.isAcceptance).to.be.false;
        binary = [0, 0, 0, 0];
        n = binary.length;
        state = __machine.next(binary[0], 'S1');
        for (i = 1; i < n; ++i) {
            state = __machine.next(binary[i]);
        }
        expect(state.to).to.equal('S1');
        expect(__machine.isAcceptance).to.be.true;
    });
    it('machine test #2', function () {
        // test generated strings
        __machine.clear();
        __machine.addState('S1');
        __machine.addState('S2');
        __machine.addState('S3');
        __machine.addState('S4', true);
        expect(__machine.addTransition('S1', f12)).to.be.true;
        expect(__machine.addTransition('S2', f22)).to.be.true;
        expect(__machine.addTransition('S3', f32)).to.be.true;
        expect(__machine.addTransition('S4', f42)).to.be.true;
        expect(__machine.numTransitions).to.equal(4);
        var str = ['a'];
        var n = str.length;
        var i;
        var state = __machine.next(str[0], 'S1');
        expect(state.to).to.equal('S2');
        str = ['a', 'b'];
        n = str.length;
        for (i = 1; i < n; ++i) {
            state = __machine.next(str[i]);
        }
        expect(state.to).to.equal('S1');
        expect(__machine.isAcceptance).to.be.false;
        str = ['a', 'b', 'a', 'c'];
        n = str.length;
        state = __machine.next(str[0], 'S1');
        for (i = 1; i < n; ++i) {
            state = __machine.next(str[i]);
        }
        expect(__machine.isAcceptance).to.be.true;
        str = ['a', 'b', 'a', 'c', 'd', 'a', 'a', 'c'];
        n = str.length;
        state = __machine.next(str[0], 'S1');
        for (i = 1; i < n; ++i) {
            state = __machine.next(str[i]);
        }
        expect(__machine.isAcceptance).to.be.true;
        str = ['a', 'a', 'a', 'a', 'a', 'c'];
        n = str.length;
        state = __machine.next(str[0], 'S1');
        for (i = 1; i < n; ++i) {
            state = __machine.next(str[i]);
        }
        expect(__machine.isAcceptance).to.be.true;
        str = ['a', 'a', 'a', 'a', 'c', 'd'];
        n = str.length;
        state = __machine.next(str[0], 'S1');
        for (i = 1; i < n; ++i) {
            state = __machine.next(str[i]);
        }
        expect(__machine.isAcceptance).to.be.false;
    });
    it('machine test #3', function () {
        // does a binary sequence end in a one?
        __machine.clear();
        __machine.addState('S1');
        __machine.addState('S2', true);
        expect(__machine.numStates).to.equal(2);
        expect(__machine.addTransition('S1', f13)).to.be.true;
        expect(__machine.numTransitions).to.equal(1);
        expect(__machine.addTransition('S2', f23)).to.be.true;
        expect(__machine.numTransitions).to.equal(2);
        var binary = [1, 0];
        var n = binary.length;
        var i;
        var state = __machine.next(binary[0], 'S1');
        for (i = 1; i < n; ++i) {
            state = __machine.next(binary[i]);
        }
        expect(state.to).to.equal('S1');
        expect(__machine.isAcceptance).to.be.false;
        binary = [1];
        n = binary.length;
        state = __machine.next(binary[0], 'S1');
        for (i = 1; i < n; ++i) {
            state = __machine.next(binary[i]);
        }
        expect(state.to).to.equal('S2');
        expect(__machine.isAcceptance).to.be.true;
        binary = [0];
        n = binary.length;
        state = __machine.next(binary[0], 'S1');
        for (i = 1; i < n; ++i) {
            state = __machine.next(binary[i]);
        }
        expect(state.to).to.equal('S1');
        expect(__machine.isAcceptance).to.be.false;
        binary = [0, 1, 0];
        n = binary.length;
        state = __machine.next(binary[0], 'S1');
        for (i = 1; i < n; ++i) {
            state = __machine.next(binary[i]);
        }
        expect(__machine.isAcceptance).to.be.false;
        binary = [0, 1, 0, 1];
        n = binary.length;
        state = __machine.next(binary[0], 'S1');
        for (i = 1; i < n; ++i) {
            state = __machine.next(binary[i]);
        }
        expect(__machine.isAcceptance).to.be.true;
        binary = [1, 0, 1, 1, 1, 1];
        n = binary.length;
        state = __machine.next(binary[0], 'S1');
        for (i = 1; i < n; ++i) {
            state = __machine.next(binary[i]);
        }
        expect(__machine.isAcceptance).to.be.true;
    });
    it('machine test #4 with transition handlers', function () {
        // elevator goes between floor zero and one
        __machine.clear();
        // there are no acceptance states
        __machine.addState('GROUND');
        __machine.addState('FIRST');
        expect(__machine.numStates).to.equal(2);
        expect(__machine.addTransition('GROUND', f14)).to.be.true;
        expect(__machine.numTransitions).to.equal(1);
        expect(__machine.addTransition('FIRST', f24)).to.be.true;
        expect(__machine.numTransitions).to.equal(2);
        var elevatorObserver = {
            next: function (trans) {
                var leg = trans.from + trans.to;
                DIRECTION = leg == 'GROUNDFIRST' ? 'UP' : (leg == 'FIRSTGROUND' ? 'DOWN' : trans.from);
            },
            error: function () {
            },
            complete: function () {
            }
        };
        __machine.addSubscriber(elevatorObserver);
        var state = __machine.next('', 'GROUND');
        expect(DIRECTION).to.equal('GROUND');
        state = __machine.next('UP');
        expect(DIRECTION).to.equal('UP');
        state = __machine.next('UP');
        expect(DIRECTION).to.equal('FIRST'); // remain on 1st floor
        state = __machine.next('DOWN');
        expect(DIRECTION).to.equal('DOWN');
        state = __machine.next('DOWN');
        expect(DIRECTION).to.equal('GROUND'); // remain on ground floor
    });
    it('change machine test #1', function () {
        // accept coins for amount less than one dollar and tally amount of each coin as well as change to be made, if any
        __machine.clear();
        // States are p (pennies), n (nickels), d (dimes), q (quarters), and c (complete)
        __machine.addState('p');
        __machine.addState('n');
        __machine.addState('q');
        __machine.addState('d');
        __machine.addState('c', true); // 'complete' is the acceptance state
        expect(__machine.numStates).to.equal(5);
        // initial payment state; start with 15 cents
        var payment = {
            p: 0,
            n: 0,
            d: 0,
            q: 0,
            amt: 0.15,
            change: 0
        };
        // we can use one transition function for everything; note that we never transition from the completed state
        // yes, all your transition are belong to us :)
        __machine.addTransition('p', payola);
        __machine.addTransition('n', payola);
        __machine.addTransition('d', payola);
        __machine.addTransition('q', payola);
        expect(__machine.numTransitions).to.equal(4);
        // begin with a penny payment - the following would normally be executed in a while loop that terminated as soon
        // as the acceptance state was realized
        var state = __machine.next(payment, 'p');
        expect(state.to).to.equal('p');
        expect(Math.abs(state.data.amt - 0.14) < 0.001).to.be.true;
        // remaining sequence of payments
        state = __machine.next(payment, 'n');
        expect(state.to).to.equal('n');
        expect(Math.abs(state.data.amt - 0.09) < 0.001).to.be.true;
        state = __machine.next(payment, 'n');
        expect(state.to).to.equal('n');
        expect(Math.abs(state.data.amt - 0.04) < 0.001).to.be.true;
        state = __machine.next(payment, 'd');
        expect(state.to).to.equal('c');
        expect(__machine.isAcceptance).to.be.true;
        expect((Math.abs(state.data.change) - 0.06) < 0.001).to.be.true;
    });
    it('change machine test #2 (with observer)', function () {
        __machine.clear();
        __machine.addState('p');
        __machine.addState('n');
        __machine.addState('q');
        __machine.addState('d');
        __machine.addState('c', true);
        var payment = {
            p: 0,
            n: 0,
            d: 0,
            q: 0,
            amt: 0.68,
            change: 0
        };
        __machine.addTransition('p', payola);
        __machine.addTransition('n', payola);
        __machine.addTransition('d', payola);
        __machine.addTransition('q', payola);
        var changeObserver = {
            next: function (trans) {
                PAYMENT_COMPLETE = trans.to == 'c' ? 'COMPLETE' : ''; // outside indication that payment is complete
            },
            error: function () {
            },
            complete: function () {
            }
        };
        __machine.addSubscriber(changeObserver);
        var state = __machine.next(payment, 'q');
        expect(state.to).to.equal('q');
        expect(Math.abs(state.data.amt - 0.43) < 0.001).to.be.true;
        expect(PAYMENT_COMPLETE).to.equal('');
        state = __machine.next(payment, 'q');
        expect(state.to).to.equal('q');
        expect(Math.abs(state.data.amt - 0.18) < 0.001).to.be.true;
        expect(PAYMENT_COMPLETE).to.equal('');
        state = __machine.next(payment, 'q');
        expect(state.to).to.equal('c');
        expect(Math.abs(state.data.change - 0.07) < 0.001).to.be.true;
        expect(PAYMENT_COMPLETE).to.equal('COMPLETE');
        expect(__machine.isAcceptance).to.be.true;
    });
    it('change machine test #3', function () {
        __machine.clear();
        __machine.addState('p');
        __machine.addState('n');
        __machine.addState('q');
        __machine.addState('d');
        __machine.addState('c', true);
        var payment = {
            p: 0,
            n: 0,
            d: 0,
            q: 0,
            amt: 0.68,
            change: 0
        };
        __machine.addTransition('p', payola);
        __machine.addTransition('n', payola);
        __machine.addTransition('d', payola);
        __machine.addTransition('q', payola);
        var state = __machine.next(payment, 'q');
        expect(state.to).to.equal('q');
        expect(Math.abs(state.data.amt - 0.43) < 0.001).to.be.true;
        state = __machine.next(payment, 'q');
        expect(state.to).to.equal('q');
        expect(Math.abs(state.data.amt - 0.18) < 0.001).to.be.true;
        state = __machine.next(payment, 'd');
        expect(state.to).to.equal('d');
        expect(Math.abs(state.data.amt - 0.08) < 0.001).to.be.true;
        state = __machine.next(payment, 'n');
        expect(state.to).to.equal('n');
        expect(Math.abs(state.data.amt - 0.03) < 0.001).to.be.true;
        state = __machine.next(payment, 'p');
        expect(state.to).to.equal('p');
        expect(Math.abs(state.data.amt - 0.02) < 0.001).to.be.true;
        state = __machine.next(payment, 'p');
        expect(state.to).to.equal('p');
        expect(Math.abs(state.data.amt - 0.01) < 0.001).to.be.true;
        state = __machine.next(payment, 'p');
        expect(state.to).to.equal('c');
        expect(Math.abs(state.data.amt) < 0.001).to.be.true;
        expect(Math.abs(state.data.change) < 0.001).to.be.true;
        expect(__machine.isAcceptance).to.be.true;
    });
    it('fromJson() returns correct error properties for bad data', function () {
        __machine.clear();
        var result = __machine.fromJson({
            initialState: "S1",
            alphabet: [
                'a',
                'b',
                'c',
                'd'
            ],
            states: [
                {
                    name: 'S1',
                    isAcceptance: false,
                    transition: "return data == 'a' ? {to: 'S2'} : {to: 'S1'}"
                }
            ]
        });
        expect(result.success).to.be.false;
        expect(result.action).to.equal(FiniteStateMachine_1.FiniteStateMachine.MISSING_PROPS);
        result = __machine.fromJson({
            name: 'Machine1',
            states: [
                {
                    name: 'S1',
                    isAcceptance: false,
                    transition: "return data == 'a' ? {to: 'S2'} : {to: 'S1'}"
                }
            ]
        });
        expect(result.success).to.be.false;
        expect(result.action).to.equal(FiniteStateMachine_1.FiniteStateMachine.MISSING_PROPS);
        result = __machine.fromJson({
            name: 'Machine1',
            initialState: "S1",
            alphabet: [
                'a',
                'b',
                'c',
                'd'
            ]
        });
        expect(result.success).to.be.false;
        expect(result.action).to.equal(FiniteStateMachine_1.FiniteStateMachine.MISSING_PROPS);
        result = __machine.fromJson({
            name: 'Machine1',
            initialState: "S1",
            alphabet: [
                'a',
                'b',
                'c',
                'd'
            ],
            states: []
        });
        expect(result.success).to.be.false;
        expect(result.action).to.equal(FiniteStateMachine_1.FiniteStateMachine.NO_STATE);
    });
    it('data-defined machine test #1', function () {
        __machine.clear();
        var result = __machine.fromJson(machine1);
        expect(result.success).to.be.true;
        expect(result.action).to.equal(FiniteStateMachine_1.FiniteStateMachine.VALID);
        expect(__machine.initialState).to.equal('S1');
        var alphabet = __machine.alphabet;
        expect(alphabet[0]).to.equal('a');
        expect(alphabet[1]).to.equal('b');
        expect(alphabet[2]).to.equal('c');
        expect(alphabet[3]).to.equal('d');
        // note that the original state is already set from the provided data
        var str = ['a', 'b', 'a', 'c', 'd', 'a', 'a', 'c'];
        var n = str.length;
        var i;
        var state;
        for (i = 0; i < n; ++i) {
            state = __machine.next(str[i]);
        }
        expect(__machine.isAcceptance).to.be.true;
        str = ['a', 'a', 'a', 'a', 'c', 'd'];
        n = str.length;
        for (i = 0; i < n; ++i) {
            state = __machine.next(str[i]);
        }
        expect(__machine.isAcceptance).to.be.false;
    });
    it('data-defined machine test #2', function () {
        __machine.clear();
        var result = __machine.fromJson(machine2);
        expect(result.success).to.be.true;
        expect(result.action).to.equal(FiniteStateMachine_1.FiniteStateMachine.VALID);
        expect(__machine.initialData).to.not.be.undefined;
        var payment = __machine.initialData;
        var state = __machine.next(payment, 'q');
        expect(state.to).to.equal('q');
        expect(Math.abs(state.data.amt - 0.43) < 0.001).to.be.true;
        state = __machine.next(payment, 'q');
        expect(state.to).to.equal('q');
        expect(Math.abs(state.data.amt - 0.18) < 0.001).to.be.true;
        state = __machine.next(payment, 'd');
        expect(state.to).to.equal('d');
        expect(Math.abs(state.data.amt - 0.08) < 0.001).to.be.true;
        state = __machine.next(payment, 'n');
        expect(state.to).to.equal('n');
        expect(Math.abs(state.data.amt - 0.03) < 0.001).to.be.true;
        state = __machine.next(payment, 'p');
        expect(state.to).to.equal('p');
        expect(Math.abs(state.data.amt - 0.02) < 0.001).to.be.true;
        state = __machine.next(payment, 'p');
        expect(state.to).to.equal('p');
        expect(Math.abs(state.data.amt - 0.01) < 0.001).to.be.true;
        state = __machine.next(payment, 'p');
        expect(state.to).to.equal('c');
        expect(Math.abs(state.data.amt) < 0.001).to.be.true;
        expect(Math.abs(state.data.change) < 0.001).to.be.true;
        expect(__machine.isAcceptance).to.be.true;
    });
    it('factory creates a machine correctly from Object data', function () {
        var machine = FiniteStateMachine_1.FiniteStateMachine.create(machine2);
        expect(machine).to.not.be.null;
        expect(machine.initialData).to.not.be.undefined;
        var payment = __machine.initialData;
        var state = machine.next(payment, 'q');
        expect(state.to).to.equal('q');
        expect(Math.abs(state.data.amt - 0.43) < 0.001).to.be.true;
        state = machine.next(payment, 'q');
        expect(state.to).to.equal('q');
        expect(Math.abs(state.data.amt - 0.18) < 0.001).to.be.true;
        state = machine.next(payment, 'd');
        expect(state.to).to.equal('d');
        expect(Math.abs(state.data.amt - 0.08) < 0.001).to.be.true;
        state = machine.next(payment, 'n');
        expect(state.to).to.equal('n');
        expect(Math.abs(state.data.amt - 0.03) < 0.001).to.be.true;
        state = machine.next(payment, 'p');
        expect(state.to).to.equal('p');
        expect(Math.abs(state.data.amt - 0.02) < 0.001).to.be.true;
        state = machine.next(payment, 'p');
        expect(state.to).to.equal('p');
        expect(Math.abs(state.data.amt - 0.01) < 0.001).to.be.true;
        state = machine.next(payment, 'p');
        expect(state.to).to.equal('c');
        expect(Math.abs(state.data.amt) < 0.001).to.be.true;
        expect(Math.abs(state.data.change) < 0.001).to.be.true;
        expect(machine.isAcceptance).to.be.true;
    });
    it('factory returns null machine from bad data', function () {
        var machine = FiniteStateMachine_1.FiniteStateMachine.create({});
        expect(machine).to.be.null;
    });
});
