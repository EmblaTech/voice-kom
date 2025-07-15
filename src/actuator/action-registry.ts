// import { IActionRegistry, Action } from '../types';
// import { EventBus } from '../common/eventbus';

// export class ActionRegistry implements IActionRegistry {
//   private actionMap = new Map<string, Action>();               // name -> action instance
//   private intentToActions = new Map<string, string[]>();       // intent -> action names

//   constructor(private eventBus: EventBus
//     )
//     {}
//   registerAction(name: string, action: Action): void {
//     if (this.actionMap.has(name)) {
//       console.warn(`ActionRegistry: Action "${name}" is already registered`);
//       return;
//     }
//     this.actionMap.set(name, action);
//   }

//   mapIntentToAction(intent: string, actionName: string): void {
//     if (!this.actionMap.has(actionName)) {
//       throw new Error(`ActionRegistry: Cannot map intent "${intent}" to unregistered action "${actionName}"`);
//     }

//     if (!this.intentToActions.has(intent)) {
//       this.intentToActions.set(intent, []);
//     }

//     const actions = this.intentToActions.get(intent)!;
//     if (!actions.includes(actionName)) {
//       actions.push(actionName);
//     }
//   }

//   getActions(intent: string): Action[] {
//     const actionNames = this.intentToActions.get(intent) || [];
//     return actionNames
//       .map(name => this.actionMap.get(name))
//       .filter((a): a is Action => a !== undefined);
//   }

//   getRegisteredActionNames(): string[] {
//     return [...this.actionMap.keys()];
//   }
// }
