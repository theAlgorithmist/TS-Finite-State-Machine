# A Reactive, Data-Driven Finite State Machine

I recently completed the development of a suite of tools for my client-only Angular Dev Toolkit.  This development was centered around the concept of data-driven logic in applications.  Two of the tools (Expression-based Decision Tree and Sequencing Engine) were derivatives of work for NDA clients, so they remain proprietary to the toolkit.

Based on private and social-media conversations, it appears there is sufficient interest to warrant open-sourcing the baseline version of the finite state machine, which is the final component of this development.  

So, here it is, and always remember the three rules

1 - Experiment
2 - Have Fun
3 - Drink Coffee


Author:  Jim Armstrong - [The Algorithmist]

@algorithmist

theAlgorithmist [at] gmail [dot] com

Typescript: 2.4.3

Rxjs: 5.5.6

Requires ES6 _Map_ and _Set_

Version: 1.0


## Installation

Installation involves all the usual suspects

  - npm and gulp installed globally
  - Clone the repository
  - npm install
  - get coffee (this is the most important step)


### Building and running the tests

1. gulp compile

2. gulp test

The test suite is in Mocha/Chai and specs reside in the _test_ folder.


### Introductions

This page contains one of my favorite [online descriptions of a Finite State Machine] and is closest to how I learned the topic 'back in the day.'

The machine implementation in this repo is Mealy-style, although a state may be passed as data, so Moore-style machines can be used within this framework.

A FSM consists of a number of named states, and transitions from those states.  One or more states may be defined as an _acceptance_ state, meaning that after exercising the machine with a finite number of inputs, the machine may indicate acceptance of a certain criteria.  This could be a valid string or that the number of zeros in a binary sequence is even.  It is possible (and I've done this in C++) to define a _rejection_ state with the convention that the machine may never transition out of this state.  This is a way to catch and flag incorrect or other inputs.

The set of inputs to a FSM is called an _alphabet_.

The _FiniteStateMachine_ class in this distribution has two possibly differentiating features from other implementations (particularly in Java, JS, and TS).  One is that listening for specific state transitions is not performed by callback functions applied to those states.  Instead, the machine is reactive.  One or more (RxJs) _Observers_ may subscribe to the machine and receive updates on all transitions that includes _from_ and _to_ states as well as relevant data.


### Public API

The _FiniteStateMachine_ class exposes the following models

```
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
```

The public API of the class is as follows.

```
public static create(data: Object, name?: string): FiniteStateMachine | null
public get numStates(): number
public get numTransitions(): number
public get currentState(): string
public get states(): IterableIterator<string>
public get initialState(): string
public get initialData(): Object | null
public get isAcceptance(): boolean
public get alphabet(): Array<string> | null
public fromJson(data: Object): IDecisionTreeAction
public addState(stateName: string, acceptance: boolean=false): void
public addTransition(from: string, to: transFunction): boolean
public addSubscriber(observer: Observer <IStateTransition>): void
public next(input: any, initialState?: string): IStateOutput | null
public clear(): void
```
### Usage  

The FSM in this distribution may be used by directly assigning states and transition functions.  The machine may also be described with _Object_ data.  These cases are best illustrated by example.

First, consider one of the machines discussed in the above introductions to FSM's.  This machine is designed to test sequences consisting of the letters _a_, _b_, _c_, and _d_, which is the machine's alphabet.

The states are _S1_, _S2_, _S3_, and _S4_, the latter of which is the acceptance state.  The machine's initial state is _S1_ and letters are input one at a time.  The machine is tested for being in the acceptance state after the final transition (refer to the above link for the state diagram).

This machine can be implemented with the following code (which is provided in the specs located in the _test_ folder) which presumes a string input Array, _str_, i.e.

```
const str: Array<string> = ['a', 'a', 'a', 'a', 'c', 'd'];
```
 
Note that the transition functions are defined statically in code, which allows them to use stronger typing than is described in the _transFunction_ interface.

For compactness, testing the return value from adding a transition is not included in the example.

```
const f12: transFunction = (data: string) => {
  return data == 'a' ? {to: 'S2'} : {to: 'S1'}
};

const f22: transFunction = (data: string) => {
  return data == 'a' ? {to: 'S2'} : (data == 'b' ? {to: 'S1'} : (data == 'c' ? {to: 'S4'} : {to: 'S2'}))
};

const f32: transFunction = (data: string) => {
  return data == 'a' ? {to: 'S1'} : (data == 'b' ? {to: 'S4'} : {to: 'S3'})
};

const f42: transFunction = (data: string) => {
  return data == 'd' ? {to: 'S3'} : {to: 'S4'}
};
.
.
.
const __machine: FiniteStateMachine = new FiniteStateMachine();

__machine.addState('S1');
__machine.addState('S2');
__machine.addState('S3');
__machine.addState('S4', true);

__machine.addTransition('S1', f12);
__machine.addTransition('S2', f22);
__machine.addTransition('S3', f32);
__machine.addTransition('S4', f42);

const n: number = str.length;
let i: number;

let state: IStateOutput = __machine.next(str[0], 'S1');  // set the initial state and first input
for (i = 1; i < n; ++i) {
  state = __machine.next(str[i]);
}
```

Based on the machine's construction, we would expect ___machine.isAcceptance_ to be false.  This is also the answer to the quiz question posed on the site from which the example was taken :)
  
Many algorithms can be expressed as a FSM and Regex is equivalent to FSM (Kleene's Theorem), for example.  Whether or not one _should_ implement an algorithm using a FSM is another topic.  One example that often does not seem to fit a FSM architecture is the 'change machine' problem (this was a lab exercise in college).

Consider a machine that accepts coins (penny, nickel, dime, quarter) for an amount less than a dollar.  After each coin is deposited, the machine updates the remaining balance, indicates if sufficient payment has been made, and computes any necessary change.

Alphabet and machine states may be considered equivalent in this machine, so we define states _p_, _n_, _d_, _q_, and _c_ for the coin denominations and a 'complete' state.  There is no transition out of the complete state, which is also the acceptance state for this machine.

Code to implement this machine is provided in the specs.

The most potentially useful feature of this FSM is the ability to describe a machine in data.  This allows multiple machines to be defined in metadata and then dynamically applied based on real-time conditions in an application.

The string-test machine shown above can be described in the following data _Object_

```
const machine1: Object = {
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
```

Transition functions defined in data will be called with arguments that strictly match the _transFunction_ interface.  They must adhere to the following conventions.

1. Only the function body need be defined in a string.
2. The variable names _data_ and _state_ are arguments.  Use them as such.
3. Transition functions must be pure.
4. The self-referential pointer (this) is bound to the global context due to Function constructor invocation.  Do not use _this_ inside the function body.
5. Do not reference any variables that are not defined in the function body as we can not be 'loose' regarding execution context of these functions.

In a typical application, the above _Object_ description is input external to the application.  Implementation of the machine reduces to

```
let result: IDecisionTreeAction = __machine.fromJson(machine1);

let str: Array<string> = ['a', 'b', 'a', 'c', 'd', 'a', 'a', 'c'];
let n: number          = str.length;
let i: number;
let state: IStateOutput;

for (i = 0; i < n; ++i) {
  state = __machine.next(str[i]);
}

```

We would expect ___machine.isAcceptance_ to be true.

Refer to the specs in the _test_ folder for more usage examples.  This includes a data-driven version of the change machine example.

I will continue to modify this class for specific use in my Angular Dev Toolkit and hope you find this baseline version useful.


License
----

Apache 2.0

**Free Software? Yeah, Homey plays that**

[//]: # (kudos http://stackoverflow.com/questions/4823468/store-comments-in-markdown-syntax)

[The Algorithmist]: <http://algorithmist.net>

[online descriptions of a Finite State Machine]: <https://brilliant.org/wiki/finite-state-machines>

