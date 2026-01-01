/**
 * Fact Builder Utility
 *
 * Converts player actions into F2F-Engine Fact format.
 * Each method creates a properly formatted Fact for different action types.
 */

import { Fact, FactType } from "@/lib/engine/types";

export class FactBuilder {
  private sessionId: string;
  private playerId: string;

  constructor(sessionId: string, playerId: string = "player") {
    this.sessionId = sessionId;
    this.playerId = playerId;
  }

  /**
   * Create a base fact with common fields
   */
  private createFact(
    type: FactType,
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
      attributes,
      tags,
    };
  }

  // ============== Movement Actions ==============

  /**
   * Player moves to a new location
   */
  move(destination: string): Fact {
    return this.createFact(
      "ACTION",
      "move",
      { destination },
      destination,
      ["movement"]
    );
  }

  /**
   * Player enters a building or area
   */
  enter(locationId: string, locationType?: string): Fact {
    return this.createFact(
      "ACTION",
      "enter",
      { location_type: locationType },
      locationId,
      ["movement", "exploration"]
    );
  }

  /**
   * Player exits a building or area
   */
  exit(locationId: string): Fact {
    return this.createFact(
      "ACTION",
      "exit",
      {},
      locationId,
      ["movement"]
    );
  }

  // ============== Interaction Actions ==============

  /**
   * Player examines something
   */
  examine(targetId: string, targetType?: string): Fact {
    return this.createFact(
      "ACTION",
      "examine",
      { target_type: targetType },
      targetId,
      ["exploration", "investigation"]
    );
  }

  /**
   * Player talks to an NPC
   */
  talk(npcId: string, topic?: string): Fact {
    return this.createFact(
      "ACTION",
      "talk",
      { topic },
      npcId,
      ["dialogue", "social"]
    );
  }

  /**
   * Player asks about something
   */
  ask(npcId: string, subject: string): Fact {
    return this.createFact(
      "ACTION",
      "ask",
      { subject },
      npcId,
      ["dialogue", "investigation"]
    );
  }

  // ============== Item Actions ==============

  /**
   * Player takes/picks up an item
   */
  take(itemId: string): Fact {
    return this.createFact(
      "ACTION",
      "take",
      {},
      itemId,
      ["inventory"]
    );
  }

  /**
   * Player drops an item
   */
  drop(itemId: string): Fact {
    return this.createFact(
      "ACTION",
      "drop",
      {},
      itemId,
      ["inventory"]
    );
  }

  /**
   * Player uses an item (optionally on a target)
   */
  use(itemId: string, targetId?: string): Fact {
    return this.createFact(
      "ACTION",
      "use",
      { target: targetId },
      itemId,
      ["inventory", "interaction"]
    );
  }

  /**
   * Player gives an item to someone
   */
  give(itemId: string, recipientId: string): Fact {
    return this.createFact(
      "ACTION",
      "give",
      { recipient: recipientId },
      itemId,
      ["inventory", "social"]
    );
  }

  // ============== Combat Actions ==============

  /**
   * Player attacks a target
   */
  attack(targetId: string, weaponId?: string): Fact {
    return this.createFact(
      "ACTION",
      "attack",
      { weapon: weaponId },
      targetId,
      ["combat"]
    );
  }

  /**
   * Player defends
   */
  defend(): Fact {
    return this.createFact(
      "ACTION",
      "defend",
      {},
      undefined,
      ["combat"]
    );
  }

  /**
   * Player flees from combat
   */
  flee(): Fact {
    return this.createFact(
      "ACTION",
      "flee",
      {},
      undefined,
      ["combat", "movement"]
    );
  }

  // ============== Status Actions ==============

  /**
   * Player rests to recover
   */
  rest(duration?: number): Fact {
    return this.createFact(
      "ACTION",
      "rest",
      { duration },
      undefined,
      ["recovery"]
    );
  }

  /**
   * Player waits/passes time
   */
  wait(duration?: number): Fact {
    return this.createFact(
      "ACTION",
      "wait",
      { duration },
      undefined,
      ["time"]
    );
  }

  // ============== Choice/Directive Actions ==============

  /**
   * Player selects a choice from a directive
   */
  selectChoice(
    choiceId: string,
    choiceLabel: string,
    directiveId?: string
  ): Fact {
    return this.createFact(
      "ACTION",
      "select_choice",
      {
        choice_id: choiceId,
        choice_label: choiceLabel,
        directive_id: directiveId,
      },
      choiceId,
      ["choice", "directive_response"]
    );
  }

  /**
   * Player provides a free-form response
   */
  respond(responseText: string, directiveId?: string): Fact {
    return this.createFact(
      "ACTION",
      "respond",
      {
        response: responseText,
        directive_id: directiveId,
      },
      undefined,
      ["response", "directive_response"]
    );
  }

  // ============== State Changes ==============

  /**
   * Record a state change (HP, gold, etc.)
   */
  stateChange(changes: Record<string, unknown>): Fact {
    return this.createFact(
      "STATE_CHANGE",
      "state_update",
      changes,
      undefined,
      ["state"]
    );
  }

  /**
   * Record location change
   */
  locationChange(newLocation: string, previousLocation?: string): Fact {
    return this.createFact(
      "STATE_CHANGE",
      "location_change",
      {
        new_location: newLocation,
        previous_location: previousLocation,
      },
      newLocation,
      ["state", "movement"]
    );
  }

  // ============== System Events ==============

  /**
   * Game session started
   */
  sessionStart(): Fact {
    return this.createFact(
      "SYSTEM",
      "session_start",
      { started_at: new Date().toISOString() },
      undefined,
      ["system"]
    );
  }

  /**
   * Game session ended
   */
  sessionEnd(reason?: string): Fact {
    return this.createFact(
      "SYSTEM",
      "session_end",
      { reason, ended_at: new Date().toISOString() },
      undefined,
      ["system"]
    );
  }

  // ============== Generic Action ==============

  /**
   * Create a custom action
   */
  custom(
    verb: string,
    objectId?: string,
    attributes: Record<string, unknown> = {},
    tags: string[] = []
  ): Fact {
    return this.createFact("ACTION", verb, attributes, objectId, tags);
  }
}

/**
 * Create a new FactBuilder instance
 */
export function createFactBuilder(
  sessionId: string,
  playerId?: string
): FactBuilder {
  return new FactBuilder(sessionId, playerId);
}
