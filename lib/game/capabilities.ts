/**
 * Game Capabilities Configuration
 *
 * Defines what the web game client can express and handle.
 * This is sent to F2F-Engine to guide experience generation.
 */

import { type Capabilities, type JsonValue } from "@/lib/engine/sdk-bridge";

export const GAME_ID = "text_adventure";

export const SUPPORTED_CHANNELS = [
  "text",
  "choice_menu",
  "quest_log",
  "notification",
  "dialogue",
  "narration",
] as const;

export const SUPPORTED_ACTIONS = [
  "display_text",
  "show_choices",
  "update_status",
  "play_sound",
  "show_image",
  "set_flag",
  "give_item",
  "remove_item",
  "change_location",
] as const;

export const DEFAULT_CAPABILITIES: Capabilities = {
  game_id: GAME_ID,
  supports_channels: [...SUPPORTED_CHANNELS],
  supports_actions: [...SUPPORTED_ACTIONS],
  limits: {
    max_choices: 4 as JsonValue,
    max_text_len: 300 as JsonValue,
    max_clues: 3 as JsonValue,
    supports_timers: false as JsonValue,
    supports_typing: true as JsonValue,
  },
};

export function createCapabilities(
  overrides: Record<string, JsonValue> = {}
): Capabilities {
  return {
    ...DEFAULT_CAPABILITIES,
    limits: {
      ...DEFAULT_CAPABILITIES.limits,
      ...overrides,
    },
  };
}

export const GAME_LOCATIONS = {
  village_square: {
    id: "village_square",
    name: "마을 광장",
    description: "활기찬 상인 마을의 중심부입니다.",
    connections: ["tavern", "blacksmith", "market", "town_gate"],
  },
  tavern: {
    id: "tavern",
    name: "여관",
    description: "따뜻하고 시끄러운 여관입니다.",
    connections: ["village_square", "tavern_room"],
  },
  tavern_room: {
    id: "tavern_room",
    name: "여관 방",
    description: "조용한 개인 방입니다.",
    connections: ["tavern"],
  },
  blacksmith: {
    id: "blacksmith",
    name: "대장간",
    description: "뜨거운 열기와 쇠 두드리는 소리가 가득합니다.",
    connections: ["village_square"],
  },
  market: {
    id: "market",
    name: "시장",
    description: "다양한 물건을 파는 노점들이 늘어서 있습니다.",
    connections: ["village_square", "alley"],
  },
  alley: {
    id: "alley",
    name: "골목",
    description: "어둡고 좁은 골목길입니다.",
    connections: ["market"],
  },
  town_gate: {
    id: "town_gate",
    name: "마을 입구",
    description: "마을로 들어오는 큰 문입니다.",
    connections: ["village_square", "forest_path"],
  },
  forest_path: {
    id: "forest_path",
    name: "숲길",
    description: "울창한 숲으로 이어지는 길입니다.",
    connections: ["town_gate", "forest_clearing"],
  },
  forest_clearing: {
    id: "forest_clearing",
    name: "숲속 빈터",
    description: "숲 깊은 곳의 작은 빈터입니다.",
    connections: ["forest_path"],
  },
} as const;

export type LocationId = keyof typeof GAME_LOCATIONS;

export function getLocation(locationId: string) {
  return GAME_LOCATIONS[locationId as LocationId] ?? null;
}

export function getConnectedLocations(locationId: string): string[] {
  const location = getLocation(locationId);
  return location?.connections ? [...location.connections] : [];
}
