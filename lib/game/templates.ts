/**
 * Game Template System
 *
 * Defines game templates that configure the entire game experience.
 * Each template includes schema, capabilities, locations, and UI settings.
 */

import {
  Capabilities,
  GameSchema,
  SessionRuntimeConfig,
} from "@/lib/engine/types";

// ============== Location Types ==============

export interface LocationInfo {
  id: string;
  name: string;
  description: string;
  connections: string[];
}

// ============== Template Types ==============

export type GameTheme = "fantasy" | "sci-fi" | "mystery" | "horror" | "custom";
export type TerminalTheme = "green" | "amber" | "blue" | "white";

export interface UIConfig {
  primaryColor: string;
  terminalTheme: TerminalTheme;
  titleArt?: string;
}

export interface GameTemplate {
  id: string;
  name: string;
  description: string;
  theme: GameTheme;
  gameSchema: GameSchema;
  runtimeConfig: SessionRuntimeConfig;
  capabilities: Capabilities;
  initialWorldState: Record<string, unknown>;
  locations: Record<string, LocationInfo>;
  uiConfig: UIConfig;
}

// ============== Text Adventure Template ==============

const TEXT_ADVENTURE_LOCATIONS: Record<string, LocationInfo> = {
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
};

const TEXT_ADVENTURE_SCHEMA: GameSchema = {
  fact_verb_specs: {
    user_input: {
      description: "사용자가 자유형 텍스트를 입력",
      triggers_decision: true,
      semantic_hint: "user_action",
    },
    select_choice: {
      description: "사용자가 선택지를 선택",
      triggers_decision: true,
      semantic_hint: "decision",
      attributes_schema: {
        format: "F2F_SCHEMA_V1",
        schema: {
          choice_id: { type: "string", required: true },
          choice_label: { type: "string", required: true },
          directive_id: { type: "string", required: true },
          success: { type: "boolean", required: true },
        },
      },
    },
    move: {
      description: "플레이어가 위치를 이동",
      triggers_decision: false,
      semantic_hint: "navigation",
    },
    talk: {
      description: "플레이어가 NPC와 대화",
      triggers_decision: true,
      semantic_hint: "social",
    },
    examine: {
      description: "플레이어가 대상을 조사",
      triggers_decision: true,
      semantic_hint: "investigation",
    },
    take: {
      description: "플레이어가 아이템을 획득",
      triggers_decision: false,
      semantic_hint: "inventory",
    },
    use: {
      description: "플레이어가 아이템을 사용",
      triggers_decision: true,
      semantic_hint: "action",
    },
    rest: {
      description: "플레이어가 휴식",
      triggers_decision: false,
      semantic_hint: "recovery",
    },
  },
  directive_payload_schema: {
    format: "F2F_SCHEMA_V1",
    schema: {
      objective_text: {
        type: "string",
        required: true,
        description: "플레이어에게 표시할 목표/상황 텍스트",
      },
      choices: {
        type: "array",
        required: false,
        description: "선택지 배열",
      },
      clues: {
        type: "array",
        required: false,
        description: "힌트 배열",
      },
      mood: {
        type: "string",
        required: false,
        description: "분위기 힌트",
      },
      consequence_template: {
        type: "string",
        required: false,
        description: "결과 템플릿",
      },
    },
  },
};

const TEXT_ADVENTURE_RUNTIME_CONFIG: SessionRuntimeConfig = {
  timing: {
    decision_period_seconds: 0,
    idle_threshold_seconds: 0,
    fact_timeout_seconds: 0,
    f2f_timeout_seconds: 30,
  },
  triggers: {
    decision_verbs: ["user_input", "select_choice", "talk", "examine", "use"],
    passthrough_verbs: ["move", "take", "rest"],
  },
  output: {
    short_message: true,
    include_state_events: true,
  },
};

const TEXT_ADVENTURE_CAPABILITIES: Capabilities = {
  game_id: "text_adventure",
  supports_channels: [
    "text",
    "choice_menu",
    "quest_log",
    "notification",
    "dialogue",
    "narration",
  ],
  supports_actions: [
    "display_text",
    "show_choices",
    "update_status",
    "play_sound",
    "show_image",
    "set_flag",
    "give_item",
    "remove_item",
    "change_location",
  ],
  limits: {
    max_choices: 4,
    max_text_len: 300,
    max_clues: 3,
    supports_timers: false,
    supports_typing: true,
  },
};

const TEXT_ADVENTURE_TEMPLATE: GameTemplate = {
  id: "text_adventure",
  name: "상인 마을의 실종 사건",
  description: "중세 판타지 텍스트 어드벤처. 마을에서 벌어진 실종 사건을 조사하세요.",
  theme: "fantasy",
  gameSchema: TEXT_ADVENTURE_SCHEMA,
  runtimeConfig: TEXT_ADVENTURE_RUNTIME_CONFIG,
  capabilities: TEXT_ADVENTURE_CAPABILITIES,
  initialWorldState: {
    hp: 100,
    max_hp: 100,
    gold: 50,
    location: "village_square",
    reputation: 0,
    flags: {},
  },
  locations: TEXT_ADVENTURE_LOCATIONS,
  uiConfig: {
    primaryColor: "#00ff88",
    terminalTheme: "green",
  },
};

// ============== Template Registry ==============

export const GAME_TEMPLATES: Record<string, GameTemplate> = {
  text_adventure: TEXT_ADVENTURE_TEMPLATE,
};

// ============== Helper Functions ==============

/**
 * Get a template by ID
 */
export function getTemplate(templateId: string): GameTemplate | null {
  return GAME_TEMPLATES[templateId] ?? null;
}

/**
 * Get all available templates as a list
 */
export function listTemplates(): GameTemplate[] {
  return Object.values(GAME_TEMPLATES);
}

/**
 * Get location info from a template
 */
export function getTemplateLocation(
  template: GameTemplate,
  locationId: string
): LocationInfo | null {
  return template.locations[locationId] ?? null;
}

/**
 * Get connected locations from a template
 */
export function getTemplateConnectedLocations(
  template: GameTemplate,
  locationId: string
): string[] {
  const location = getTemplateLocation(template, locationId);
  return location?.connections ? [...location.connections] : [];
}

/**
 * Get location name from a template
 */
export function getTemplateLocationName(
  template: GameTemplate,
  locationId: string
): string {
  const location = getTemplateLocation(template, locationId);
  return location?.name ?? locationId;
}
