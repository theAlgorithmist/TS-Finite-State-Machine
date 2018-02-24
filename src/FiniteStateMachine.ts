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

import { Subject      } from "rxjs/Subject";
import { Observer     } from "rxjs/Observer";
import { Subscription } from "rxjs/Subscription";

// this is normally part of the Decision Tree library, but has been ripped out to make this distribution standalone
export interface IDecisionTreeAction
{
  success: boolean;                 // true if operation was successful

  node?: Object;                    // reference to the data Object in which an error was detected

  action: string;                   // action to take
}

/**
 * A state transition must have a 'from' and 'to' (named) state and may contain optional Object data
 */
export interface IStateTransition
{
  from: string;

  to: string;

  data?: Object;
}

/**
 * Output from a state transition is the 'to' state and optional data obtained from the transition function
 */
export interface IStateOutput
{
  to: string;

  data?: any;
}

/**
 * The transition function is Mealy-style, that is a transition to a new state is based on prior state and
 * input data.  Since state is optional in this interface, pass the state name as data and a Moore-style
 * machine can be implemented.
 */
export interface transFunction
{
  (data: any, state?: string): IStateOutput;
}


/**
 * A reactive (Mealy) Finite State Machine that is designed to be driven by Object data (most likely metadata in a
 * larger collection).  While the architecture is Mealy, Moore-style machines may also be used.  Typical use is to
 * create a machine directly from the static factory ({create} method) or construct a machine and then later initialize
 * it through the {fromJson()} method.  It is also possible to manually create states and add transitions.
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
export class FiniteStateMachine
{
  public static NO_STATE: string      = '[FSM] NO_STATE';
  public static NO_DATA: string       = '[FSM] NO_DATA';
  public static VALID: string         = '[FSM] DATA_VALID';
  public static MISSING_PROPS: string = '[FSM] MISSING_PROPS';
  public static INVALID_DATA: string  = '[FSM] INVALID_DATA';

  public name: string;                                  // an optional name given to this FSM
  protected _curState: string;                          // name of the current state

  protected _states: Set<string>;                       // collection of state names
  protected _transitions: Map<string, transFunction>;   // collection of state transition functions

  protected _subject: Subject<IStateTransition>;
  protected _subscriptions: Array<Subscription>;

  // optional hash of acceptance states; there are entire classes of machines for which this concept is not
  // relevant, so this structure is created JIT
  protected _acceptanceStates: Object;

  // TODO - add rejection states

  // these are relevant to machines defined with external Object data
  protected _initialState: string;
  protected _initialData: Object;
  protected _alphabet: Array<string>;

  constructor()
  {
    this.name           = '';
    this._curState      = FiniteStateMachine.NO_STATE;
    this._states        = new Set<string>();
    this._transitions   = new Map<string, transFunction>();
    this._subject       = new Subject<IStateTransition>();
    this._subscriptions = new Array<Subscription>();

    this._initialState = FiniteStateMachine.NO_STATE;
    this._initialData  = null;
    this._alphabet     = null;
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
  public static create(data: Object, name?: string): FiniteStateMachine | null
  {
    if (data !== undefined && data != null)
    {
      let machine: FiniteStateMachine = new FiniteStateMachine();
      let result: IDecisionTreeAction = machine.fromJson(data);

      if (result.success)
      {
        machine.name = name !== undefined ? name : '';
        return machine;
      }
    }

    return null;
  }

  /**
   * Access the number of states defined for this machine
   *
   * @returns {number}
   */
  public get numStates(): number
  {
    return this._states.size;
  }

  /**
   * Access the number of state transitions defined for this machine
   *
   * @returns {number}
   */
  public get numTransitions(): number
  {
    return this._transitions.size;
  }

  /**
   * Access the current state of this machine
   *
   * @returns {string}
   */
  public get currentState(): string
  {
    return this._curState;
  }

  /**
   * Access the named states in this machine in the order they were defined
   *
   * @returns {IterableIterator<string>}
   */
  public get states(): IterableIterator<string>
  {
    return this._states.keys();
  }

  /**
   * Access the initial state of this machine
   *
   * @returns {string} This is ONLY relevant for a machine defined by {Object} data
   */
  public get initialState(): string
  {
    return this._initialState;
  }

  /**
   * Access initial data associated with the definition of this machine
   *
   * @returns {Object} This is ONLY relevant for a machine defined by {Object} data
   */
  public get initialData(): Object | null
  {
    return this._initialData ? JSON.parse(JSON.stringify(this._initialData)) : null;
  }

  /**
   * Access whether or not this machine is currently in an acceptance state
   *
   * @returns {boolean}
   */
  public get isAcceptance(): boolean
  {
    return this._acceptanceStates ? this._acceptanceStates.hasOwnProperty(this._curState) : false;
  }

  /**
   * Access the alphabet defined for this machine.
   *
   * @returns {Array<string> | null} This is ONLY relevant for a machine defined by {Object} data
   */
  public get alphabet(): Array<string> | null
  {
    return this._alphabet.slice();
  }

  /**
   * Initialize this machine from {Object} data
   *
   * @param {Object} data Data definition of this machine (must include 'name', 'alphabet', and 'states' properties
   *
   * @returns {IDecisionTreeAction} Result of data definition.  The 'success' property will be true and the 'action'
   * property will be 'VALID' for valid machine data
   */
  public fromJson(data: Object): IDecisionTreeAction
  {
    if (data === undefined || data == null)
    {
      return {
        success: false,
        action: FiniteStateMachine.NO_DATA
      }
    }

    // test required states
    if (!data.hasOwnProperty('name') || !data.hasOwnProperty('alphabet') || !data.hasOwnProperty('states'))
    {
      return {
        success: false,
        action: FiniteStateMachine.MISSING_PROPS
      }
    }

    let tmp: any = data['alphabet'];

    if (Object.prototype.toString.call(tmp) == '[object Array]')
    {
      // good to go
      this._alphabet = (< Array<string> > data['alphabet'] ).slice();
    }
    else
    {
      return {
        success: false,
        action: FiniteStateMachine.INVALID_DATA
      }
    }

    tmp = data['states'];
    let states: Array<Object>;

    if (Object.prototype.toString.call(tmp) == '[object Array]')
    {
      states = < Array<string> > data['states'];

      if (states.length == 0)
      {
        return {
          success: false,
          action: FiniteStateMachine.NO_STATE
        }
      }
    }
    else
    {
      return {
        success: false,
        action: FiniteStateMachine.INVALID_DATA
      }
    }

    this.name          = data['name'];
    this._initialState = data.hasOwnProperty('initialState') ? data['initialState'] : FiniteStateMachine.NO_STATE;
    this._curState     = this._initialState;

    // process the states
    const n: number = states.length;
    let i: number;
    let state: Object;

    for (i = 0; i < n; ++i)
    {
      state = states[i];

      // TODO - work over error handling and apply transition function variable-check
      if (state.hasOwnProperty('name') && state.hasOwnProperty('isAcceptance') && state.hasOwnProperty('transition'))
      {
        let name: string  = <string> state['name'];
        let fcn: Function = new Function('data', 'state', state['transition']);

        // TODO insert fcn-check here ...

        this.addState(name, <boolean> state['isAcceptance']);
        this.addTransition(name, <transFunction> fcn);
      }
      else
      {
        return {
          success: false,
          action: FiniteStateMachine.INVALID_DATA,
          node: state
        }
      }
    }

    // any initial data provided?
    if (data.hasOwnProperty('initialData'))
    {
      let tmp: any = data['initialData'];
      if (tmp !== undefined && Object.prototype.toString.call(tmp) == '[object Object]')
      {
        this._initialData = JSON.parse(JSON.stringify(<Object> tmp));
      }
      else
      {
        return {
          success: false,
          action: FiniteStateMachine.INVALID_DATA,
          node: tmp
        }
      }
    }

    return {
      success: true,
      action: FiniteStateMachine.VALID
    };
  }

  /**
   * Add a named state to this machine
   *
   * @param {string} stateName State name
   *
   * @param {boolean} acceptance True if this is an acceptance state for the machine
   */
  public addState(stateName: string, acceptance: boolean=false): void
  {
    if (stateName !== undefined && stateName != '')
    {
      this._states.add(stateName);

      if (acceptance)
      {
        this._acceptanceStates            = this._acceptanceStates || {};
        this._acceptanceStates[stateName] = true;
      }
    }
  }

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
  public addTransition(from: string, to: transFunction): boolean
  {
    // does the from state exist?
    const hasFrom: boolean = this._states.has(from);

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
  }

  /**
   * Add a subscriber to observe state transitions
   *
   * @param {Observer<IStateTransition>} observer
   *
   * @returns {nothing}
   */
  public addSubscriber(observer: Observer <IStateTransition>): void
  {
    if (observer !== undefined && observer != null) {
      this._subscriptions.push( this._subject.subscribe(observer) );
    }
  }

  /**
   * Transition to the next state based on current state and input data
   *
   * @param input Input data or may be a prior state name for a Moore-style machine
   *
   * @param {string} initialState The initial state to use for the machine
   *
   * @returns {IStateOutput | null}
   */
  public next(input: any, initialState?: string): IStateOutput | null
  {
    if (initialState !== undefined && initialState != '') {
      this._curState = initialState;
    }

    const transFcn: transFunction = this._transitions.get(this._curState);
    if (transFcn !== undefined)
    {
      const toState: IStateOutput = transFcn(input, this._curState);

      // transition to that state and notify observers
      this._subject.next( {
        from: this._curState,
        to: toState.to,
        data: toState.data ? toState.data : null
      });

      this._curState = toState.to;

      return {
        to: this._curState,
        data: toState.data ? toState.data : input
      }
    }

    return null;
  }

  /**
   * Clear this machine and prepare for new data
   *
   * @returns {nothing} The only machine parameter that remains unaltered is the name.  The machine is set to the
   * {NO_STATE} state.
   */
  public clear(): void
  {
    this._states.clear();
    this._transitions.clear();

    this._subscriptions.forEach( (sub: Subscription) => {sub.unsubscribe()} );

    this._subscriptions.length = 0;
    this._subject              = new Subject<IStateTransition>();
    this._curState             = FiniteStateMachine.NO_STATE;

    this._acceptanceStates = null;
    this._initialState     = FiniteStateMachine.NO_STATE;
    this._initialData      = null;
    this._alphabet         = null;
  }
}