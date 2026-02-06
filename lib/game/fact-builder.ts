/**
 * Fact Builder Utility
 *
 * Converts player actions into F2F-Engine Fact format.
 * Uses SDK Fact type where attributes and tags are optional.
 */

import { type Fact } from "@/lib/engine/sdk-bridge";

export class FactBuilder {
  private sessionId: string;
  private playerId: string;

  constructor(sessionId: string, playerId: string = "player") {
    this.sessionId = sessionId;
    this.playerId = playerId;
  }

  private createFact(
    type: string,
    verb: string,
    attributes: Record<string, unknown> = {},
    objectId?: string,
    tags: string[] = []
  ): Fact {
    return {
      fact_id: crypto.randomUUID(),
      session_id: this.sessionId,
      ts: new Date().toISOString(),
      type,
      subject_id: this.playerId,
      verb,
      object_id: objectId,
      attributes: attributes as Fact["attributes"],
      tags,
    };
  }

  // ============== Movement Actions ==============

  move(destination: string): Fact {
    return this.createFact("ACTION", "move", { destination }, destination, ["movement"]);
  }

  enter(locationId: string, locationType?: string): Fact {
    return this.createFact("ACTION", "enter", { location_type: locationType }, locationId, ["movement", "exploration"]);
  }

  exit(locationId: string): Fact {
    return this.createFact("ACTION", "exit", {}, locationId, ["movement"]);
  }

  // ============== Interaction Actions ==============

  examine(targetId: string, targetType?: string): Fact {
    return this.createFact("ACTION", "examine", { target_type: targetType }, targetId, ["exploration", "investigation"]);
  }

  talk(npcId: string, topic?: string): Fact {
    return this.createFact("ACTION", "talk", { topic }, npcId, ["dialogue", "social"]);
  }

  ask(npcId: string, subject: string): Fact {
    return this.createFact("ACTION", "ask", { subject }, npcId, ["dialogue", "investigation"]);
  }

  // ============== Item Actions ==============

  take(itemId: string): Fact {
    return this.createFact("ACTION", "take", {}, itemId, ["inventory"]);
  }

  drop(itemId: string): Fact {
    return this.createFact("ACTION", "drop", {}, itemId, ["inventory"]);
  }

  use(itemId: string, targetId?: string): Fact {
    return this.createFact("ACTION", "use", { target: targetId }, itemId, ["inventory", "interaction"]);
  }

  give(itemId: string, recipientId: string): Fact {
    return this.createFact("ACTION", "give", { recipient: recipientId }, itemId, ["inventory", "social"]);
  }

  // ============== Combat Actions ==============

  attack(targetId: string, weaponId?: string): Fact {
    return this.createFact("ACTION", "attack", { weapon: weaponId }, targetId, ["combat"]);
  }

  defend(): Fact {
    return this.createFact("ACTION", "defend", {}, undefined, ["combat"]);
  }

  flee(): Fact {
    return this.createFact("ACTION", "flee", {}, undefined, ["combat", "movement"]);
  }

  // ============== Status Actions ==============

  rest(duration?: number): Fact {
    return this.createFact("ACTION", "rest", { duration }, undefined, ["recovery"]);
  }

  wait(duration?: number): Fact {
    return this.createFact("ACTION", "wait", { duration }, undefined, ["time"]);
  }

  // ============== Choice/Experience Actions ==============

  selectChoice(
    choiceId: string,
    choiceLabel: string,
    experienceId?: string,
    success?: boolean
  ): Fact {
    return this.createFact(
      "ACTION",
      "select_choice",
      {
        choice_id: choiceId,
        choice_label: choiceLabel,
        experience_id: experienceId,
        success,
      },
      choiceId,
      ["choice", "experience_response"]
    );
  }

  respond(responseText: string, experienceId?: string): Fact {
    return this.createFact(
      "ACTION",
      "respond",
      {
        response: responseText,
        experience_id: experienceId,
      },
      undefined,
      ["response", "experience_response"]
    );
  }

  // ============== State Changes ==============

  stateChange(changes: Record<string, unknown>): Fact {
    return this.createFact("STATE_CHANGE", "state_update", changes, undefined, ["state"]);
  }

  locationChange(newLocation: string, previousLocation?: string): Fact {
    return this.createFact(
      "STATE_CHANGE",
      "location_change",
      { new_location: newLocation, previous_location: previousLocation },
      newLocation,
      ["state", "movement"]
    );
  }

  // ============== System Events ==============

  sessionStart(): Fact {
    return this.createFact("SYSTEM", "session_start", { started_at: new Date().toISOString() }, undefined, ["system"]);
  }

  sessionEnd(reason?: string): Fact {
    return this.createFact("SYSTEM", "session_end", { reason, ended_at: new Date().toISOString() }, undefined, ["system"]);
  }

  // ============== Generic Action ==============

  custom(
    verb: string,
    objectId?: string,
    attributes: Record<string, unknown> = {},
    tags: string[] = []
  ): Fact {
    return this.createFact("ACTION", verb, attributes, objectId, tags);
  }
}

export function createFactBuilder(
  sessionId: string,
  playerId?: string
): FactBuilder {
  return new FactBuilder(sessionId, playerId);
}
