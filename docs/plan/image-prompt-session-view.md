# Creation Odyssey - 세션 화면 이미지 프롬프트

## 용도
AI 이미지 생성 (Midjourney, DALL-E, Stable Diffusion 등)으로 게임 세션 화면 컨셉 확인

---

## 프롬프트 (영문)

### 버전 1: 하늘섬 테마 (기획서 시나리오 기반)

```
Top-down 2D pixel art game screen, floating sky island fantasy world, 64x64 pixel style, retro RPG aesthetic.

The scene shows a mystical floating island in the sky with:
- Glowing blue grass patches scattered across the terrain
- Cloud-like rocks floating slightly above ground
- A crystalline pillar emitting soft light in the center
- Small wind birds with sparkly feathers flying around
- A massive cloud whale silhouette in the distant sky
- Waterdrop spirits (small translucent blue creatures)
- Soft pastel color palette (sky blue, white, mint green, crystal purple)
- No UI elements, pure game world view
- Isometric-ish top-down perspective
- Dreamy, ethereal atmosphere

Style: 16-bit pixel art, clean pixels, limited color palette, fantasy RPG tileset style
```

### 버전 2: 일반적인 판타지 세션

```
Top-down 2D pixel art game scene, fantasy world sandbox, 32x32 pixel sprites, retro game aesthetic.

A living fantasy ecosystem viewed from above:
- Various magical creatures roaming freely
- Enchanted trees with glowing leaves
- Small ponds reflecting magical light
- Mysterious artifacts scattered around
- Day-night cycle feeling (twilight)
- Particle effects (sparkles, floating dust)
- Rich but cohesive pixel art color palette
- No HUD or UI, pure world view
- Sense of a world that lives and breathes on its own

Style: classic SNES-era RPG, clean pixel art, 16-bit aesthetic
```

### 버전 3: 미니멀 픽셀 (간결한 스타일)

```
Minimalist top-down pixel art game screen, 32x32 tile-based world, limited 16-color palette.

Simple fantasy sandbox scene:
- Small pixel creatures (4-8 pixels each)
- Basic terrain tiles (grass, water, stone)
- Tiny glowing objects representing magical items
- Clean grid-based layout
- Soft, muted colors
- No UI, world only
- Peaceful, contemplative mood
- Empty spaces for breathing room

Style: minimalist pixel art, indie game aesthetic, clean and simple
```

---

## 프롬프트 (한글 - 참고용)

```
탑다운 2D 픽셀 아트 게임 화면, 하늘에 떠 있는 판타지 섬, 64x64 픽셀 스타일.

장면 요소:
- 파랗게 빛나는 하늘 풀이 여기저기 흩어져 있음
- 땅 위에 살짝 떠 있는 구름 같은 바위들
- 중앙에 부드러운 빛을 내뿜는 수정 기둥
- 반짝이는 깃털을 가진 작은 바람새들이 날아다님
- 먼 하늘에 거대한 구름 고래의 실루엣
- 물방울 정령 (작고 투명한 파란 생명체)
- 부드러운 파스텔 색상 (하늘색, 흰색, 민트, 크리스탈 보라)
- UI 요소 없음, 순수한 게임 월드 뷰
- 몽환적이고 신비로운 분위기

스타일: 16비트 픽셀 아트, 깔끔한 픽셀, 제한된 색상 팔레트
```

---

## 추가 옵션 키워드

| 목적 | 추가 키워드 |
|-----|-----------|
| 더 레트로하게 | `8-bit, NES style, very limited palette` |
| 더 현대적으로 | `modern pixel art, HD pixels, smooth gradients` |
| 더 밝게 | `bright daylight, cheerful colors, saturated` |
| 더 어둡게 | `twilight, moody, dark fantasy, muted colors` |
| 더 미니멀하게 | `minimalist, simple shapes, lots of negative space` |
| 애니메이션 느낌 | `sprite sheet style, game assets, tileset` |

---

## 네거티브 프롬프트 (제외할 요소)

```
UI elements, health bar, buttons, text, menu, HUD, inventory, 3D render, realistic, photo, blurry, low quality, watermark, signature
```

---

## 권장 설정

| 플랫폼 | 설정 |
|-------|------|
| **Midjourney** | `--ar 16:9 --style raw --stylize 50` |
| **DALL-E** | 1792x1024, Natural style |
| **Stable Diffusion** | 768x512, pixel art LoRA 권장 |

---

## 배경 타일 생성 프롬프트

> **참고**: 배경 terrain은 넓은 영역을 표현해야 하므로 **256x256 ~ 512x512** 권장

### 하늘섬 배경 (Seamless Tile)

```
Seamless top-down pixel art terrain, floating sky island theme, 512x512 pixels, tileable.

Scene elements:
- Soft cloudy ground texture (white, light blue base)
- Magical glowing grass patches scattered across
- Transparent cloud wisps drifting
- Small star-like sparkles embedded in terrain
- Gentle elevation variations suggesting floating terrain
- Subtle cracks revealing sky beneath the island
- Ethereal mist around edges

Color palette: sky blue (#87CEEB), cloud white (#F0F8FF), mint (#98FFB3), soft lavender (#E6E6FA), pale gold (#FFFACD)

Style: clean pixel art, 16-bit RPG terrain, seamless repeating pattern, top-down view, soft and dreamy atmosphere, no characters or objects

--ar 1:1 --tile
```

### 범용 판타지 배경

```
Seamless top-down pixel art terrain, fantasy grassland, 512x512 pixels, tileable.

Terrain features:
- Lush green grass with natural variation
- Subtle dirt path textures
- Tiny wildflowers scattered (various colors)
- Small pebbles and stones
- Soft shadows suggesting gentle hills
- Natural organic feel, not grid-like

Color palette: grass green (#7EC850), dark green (#5A8F3E), dirt brown (#8B7355), flower pink (#FFB6C1), flower yellow (#FFFACD)

Style: 16-bit RPG terrain tileset, seamless tiling, clean pixel art, top-down perspective, no objects or characters, natural and peaceful

--ar 1:1 --tile
```

### 해상도 가이드

| 용도 | 권장 해상도 | 설명 |
|-----|-----------|------|
| **배경 terrain** | 512x512 | 넓은 영역, seamless tile |
| **중형 배경** | 256x256 | 특정 구역 표현 |
| **오브젝트 스프라이트** | 32x32 ~ 64x64 | 개별 오브젝트/캐릭터 |
| **대형 오브젝트** | 128x128 | 구름고래 같은 큰 존재 |

---

## 오브젝트 스프라이트 생성 프롬프트

### 예시 1: 물방울 정령

```
Single pixel art sprite, tiny water spirit creature, 32x32 pixels, transparent background.

Character design:
- Teardrop-shaped body (translucent blue)
- Two small dot eyes (white with tiny black pupils)
- Subtle inner glow effect
- Small water droplets floating around it
- Cute and friendly appearance

Color palette: crystal blue (#4FC3F7), light cyan (#B2EBF2), white highlights, soft shadow

Style: clean pixel art, game sprite, centered, single character, no background, RPG creature style
```

### 예시 2: 바람새

```
Single pixel art sprite, small wind bird creature, 32x32 pixels, transparent background.

Character design:
- Tiny round bird body (soft white/gray)
- Small wings with feather details
- Tail feathers that look like wind trails
- Sparkly particles near wing tips
- Gentle, peaceful expression

Color palette: cloud white (#F5F5F5), silver (#C0C0C0), sky blue accents (#87CEEB), sparkle gold (#FFD700)

Style: clean pixel art, game sprite, centered, single character, no background, cute fantasy creature
```

### 예시 3: 수정 기둥

```
Single pixel art sprite, magical crystal pillar, 32x32 pixels, transparent background.

Object design:
- Tall hexagonal crystal structure
- Multiple facets catching light
- Inner glow (soft purple/blue)
- Small energy particles rising from top
- Base with small crystal shards

Color palette: crystal purple (#9B59B6), light violet (#DDA0DD), white highlights, deep purple shadow (#4A235A)

Style: clean pixel art, game object sprite, centered, single item, no background, fantasy RPG style
```

### 예시 4: 구름 고래 (큰 오브젝트)

```
Single pixel art sprite, majestic cloud whale, 64x64 pixels, transparent background.

Creature design:
- Whale silhouette made of clouds
- Semi-transparent, ethereal body
- Soft edges that fade into mist
- Small glowing eyes (gentle expression)
- Trail of cloud particles behind

Color palette: cloud white (#FFFFFF), soft gray (#D3D3D3), sky blue (#87CEEB), subtle pink (#FFE4E1)

Style: clean pixel art, large game sprite, centered, single creature, no background, dreamy fantasy style
```

---

## 오브젝트 스프라이트 생성 템플릿 (동적 사용)

F2F 엔진이 새 오브젝트를 생성할 때 사용할 수 있는 템플릿:

```
Single pixel art sprite, [OBJECT_NAME], [SIZE]x[SIZE] pixels, transparent background.

Design:
- [SHAPE_DESCRIPTION]
- [KEY_FEATURE_1]
- [KEY_FEATURE_2]
- [MOOD/EXPRESSION if creature]

Color palette: [PRIMARY_COLOR], [SECONDARY_COLOR], [ACCENT_COLOR], [HIGHLIGHT]

Style: clean pixel art, game sprite, centered, single [object/creature], no background, fantasy RPG style
```

### 사용 예시

```python
# F2F 엔진에서 생성된 오브젝트 정보
object_data = {
    "name": "불꽃 요정",
    "description": "작은 불꽃 형태의 장난스러운 정령",
    "size": 32,
    "colors": ["orange", "red", "yellow"]
}

# 프롬프트 생성
prompt = f"""
Single pixel art sprite, {object_data['name']}, {object_data['size']}x{object_data['size']} pixels, transparent background.

Design based on: {object_data['description']}

Style: clean pixel art, game sprite, centered, single creature, no background, fantasy RPG style
"""
```

---

## 상태 애니메이션 스프라이트 시트 프롬프트

> 오브젝트의 여러 상태(0~N)를 한 이미지에 나열하여 생성

### 기본 템플릿 (가로 배열)

```
Pixel art sprite sheet, horizontal layout, [OBJECT_NAME] in multiple states, each frame 64x64 pixels, transparent background.

Left to right progression showing evolution/change:
Frame 1: [STATE_0 - 기본 상태]
Frame 2: [STATE_1 - 변화 상태]
Frame 3: [STATE_2 - 더 변화된 상태]
Frame 4: [STATE_3 - 최종/극단 상태]

Consistent character design across all frames, same art style, clear visual progression.

Style: clean pixel art, game sprite sheet, seamless style between frames, 16-bit RPG aesthetic
```

### 예시 1: 하늘 풀 상태 변화 (4단계)

```
Pixel art sprite sheet, horizontal layout, magical sky grass in 4 evolution states, each frame 64x64 pixels, transparent background, white background for visibility.

Left to right progression:
Frame 1: Normal sky grass - small blue-green plant with white fluffy roots, floating slightly
Frame 2: Rain-soaked grass - darker blue, water droplets on leaves, glowing tips
Frame 3: Blooming grass - flowers emerged, sparkles around, more vibrant colors
Frame 4: Ascended grass - fully luminescent, floating higher, ethereal wisps rising

Same plant base design evolving across frames. Consistent pixel art style.

Style: clean 16-bit pixel art, game sprite sheet, 4 frames in a row, fantasy plant evolution
```

### 예시 2: 물방울 정령 상태 변화 (4단계)

```
Pixel art sprite sheet, horizontal layout, water spirit creature in 4 states, each frame 64x64 pixels, transparent background.

Left to right progression:
Frame 1: Baby droplet - tiny teardrop shape, simple eyes, light blue
Frame 2: Growing spirit - larger, more defined features, bubbles around
Frame 3: Mature spirit - full size, glowing core, water particles orbiting
Frame 4: Elemental form - powerful aura, ice crystals mixed in, majestic pose

Same character evolving, consistent cute style across all frames.

Style: clean pixel art sprite sheet, 4 frames horizontal, fantasy creature evolution, RPG style
```

### 예시 3: 수정 기둥 상태 변화 (5단계)

```
Pixel art sprite sheet, horizontal layout, crystal pillar in 5 states, each frame 64x64 pixels, transparent background.

Left to right progression:
Frame 1: Dormant crystal - dull purple stone, no glow, rough surface
Frame 2: Awakening - faint inner light, smooth facets forming
Frame 3: Active - bright glow, energy particles rising, clear crystal
Frame 4: Overcharged - intense light, cracks forming, unstable energy
Frame 5: Shattered/Transformed - broken into floating shards OR evolved into new form

Consistent crystal design base, clear visual story of change.

Style: clean pixel art, game object sprite sheet, 5 frames horizontal, fantasy RPG style
```

### 예시 4: 범용 생명체 성장 (6단계)

```
Pixel art sprite sheet, horizontal row, fantasy creature life cycle, 6 frames, each 64x64 pixels, transparent background.

Evolution stages left to right:
Frame 1: Egg/Seed - small, dormant, potential energy inside
Frame 2: Hatching/Sprouting - cracks, first signs of life
Frame 3: Baby/Seedling - small but recognizable form
Frame 4: Young - growing, developing features
Frame 5: Adult - full form, prime state
Frame 6: Elder/Evolved - wise appearance OR magical transformation

Consistent design language, same color palette evolving, clear progression.

Style: clean pixel art sprite sheet, 6 frames in a row, creature evolution, 16-bit RPG aesthetic
```

---

## 스프라이트 시트 레이아웃 옵션

### 가로 배열 (권장)
```
[State 0] [State 1] [State 2] [State 3]
   64x64     64x64     64x64     64x64
         총 256x64 픽셀
```

프롬프트 키워드: `horizontal layout`, `frames in a row`, `left to right`

### 그리드 배열 (많은 상태용)
```
[State 0] [State 1] [State 2] [State 3]
[State 4] [State 5] [State 6] [State 7]
         총 256x128 픽셀 (4x2)
```

프롬프트 키워드: `grid layout`, `4x2 grid`, `sprite sheet grid`

### 세로 배열
```
[State 0]
[State 1]
[State 2]
[State 3]
총 64x256 픽셀
```

프롬프트 키워드: `vertical layout`, `stacked frames`, `top to bottom`

---

## 동적 생성 템플릿 (F2F 엔진용)

```python
def generate_sprite_sheet_prompt(object_name: str, states: list[str], frame_size: int = 64) -> str:
    """
    states = [
        "기본 상태의 작은 풀",
        "비에 젖어 파랗게 빛나는 풀",
        "꽃이 핀 풀",
        "하늘로 승천하는 풀"
    ]
    """
    num_frames = len(states)

    state_descriptions = "\n".join([
        f"Frame {i+1}: {desc}"
        for i, desc in enumerate(states)
    ])

    return f"""
Pixel art sprite sheet, horizontal layout, {object_name} in {num_frames} states, each frame {frame_size}x{frame_size} pixels, transparent background.

Left to right progression:
{state_descriptions}

Consistent design across all frames, same art style, clear visual progression.

Style: clean pixel art, game sprite sheet, {num_frames} frames in a row, 16-bit fantasy RPG aesthetic
"""
```
