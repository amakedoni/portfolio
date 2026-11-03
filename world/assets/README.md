# Island art assets

The approved direction is stored at `docs/design/island-approved.png`. These assets were created with the built-in Image Gen tool for the first implementation milestone.

## Sandstone material

File: `sandstone.png`. Retained from the initial draft for provenance; the revised scene uses actual large running-bond slabs and sparse geometric chips. Its grid texture is no longer loaded.

Final generation prompt:

> Use case: stylized-concept. Asset type: a standalone seamless square diffuse color texture for a playable 3D island ground, seen exactly from above, with no perspective or lighting. Production game art asset, not a website mockup. Create a beautiful warm pale sandstone courtyard tile material for a sunny friendly voxel/pixel engineering island. Cream/sand square paving stones in a regular subtle grid, individual stones gently varied in ivory, pale honey and light tan. Use deliberately coarse hand-painted pixel-art texture details and nearest-neighbor stepped edges. Very restrained sparse tiny chips and pixel flecks, soft low-contrast mortar, broad calm color areas. Tiles large enough to read in an isometric low-poly 3D game. Pattern seamlessly repeats on all four sides. Entire image is the flat material and nothing else: no scenery, no objects, no plants, no lettering, no cast shadows, no bevel render, no camera angle, no vignette. Aim for a quiet charming crafted material, not realistic stone photography or noisy cracked rock. Square 1024 by 1024.

## Pixel sky

File: `pixel-sky.png`. First-draft background, superseded by `pixel-sky-soft.png` after comparison with the approved concept.

Final generation prompt:

> Use case: stylized-concept. Asset type: standalone wide landscape 16:10 background texture for a sunny pixel-style 3D game. Only an open pale blue sky and scattered warm ivory pixel clouds. No ground, islands, objects, vehicles, people, text, sun disk or interface. Blue is a gentle powder blue at the upper edge, fading to very pale cream near the lower edge. Many small to medium charming cumulus cloud clusters concentrated along the edges, with ample clear calm blue in the middle so a 3D island can be rendered in front. Clouds have crisp softly stepped pixel-art silhouettes, subtle cream and very pale peach block shading, simple low resolution stylization at a large readable pixel size, and airy softness inside their broad shapes. Cozy, bright, welcoming, high quality game background. Not photorealistic clouds, not 3D cube objects, not dark storm clouds. A flat finished background artwork, edge to edge.

## Text and fonts

`pixelify-sans.ttf` is Pixelify Sans from the Google Fonts repository, licensed under the SIL Open Font License in `OFL-PixelifySans.txt`. It is used for screens and the flag. `roboto-condensed.ttf` is Roboto Condensed from the official Google Fonts repository (`ofl/robotocondensed/RobotoCondensed[wght].ttf`), licensed under the SIL Open Font License in `OFL-RobotoCondensed.txt`. Its bold Cyrillic lettering is used on the physical signs to match the reference more closely and stay readable at overview scale. Actual labels and language changes are rendered from source.

Rover, terrain, trees, furniture, satellite, tools, railings, signs and equipment are native 3D geometry in the scene modules. This keeps them independently editable and ready for driving, collisions and interaction in the next milestones.

The later archipelago extension uses the same native geometry: irregular cliff outlines, hanging vines, a wooden suspension bridge, a garden pergola, a test range canopy, checkpoints, ramp and blue demonstration rover. It adds no new raster scenery or external model dependencies.

The garden pond is also native geometry, with a recessed basin, transparent water, stone bank, reeds, lily pads, pier, fish and sonar buoy. Its ripple shader is authored in `world/js/pond.js` and clipped by the actual water outline; there is no baked water image.

The November 2 polish adds original procedural material maps in `world/js/surfaces.js`: 128-pixel colour, bump and roughness textures for wood, paving and stone, plus a small HDR sky gradient prefiltered for material reflections. These are generated locally and introduce no remote assets or model dependencies. The wind shader is shared by visible surfaces, AO and sun-depth rendering. Water ripples and caustics, cloth motion, butterflies, flowers, ferns, small workshop props and rover hardware are also original code/geometry.

The subsequent art pass adds native beveled equipment and cliff blocks, workshop terraces and an inset rover pad. `world/js/cascade.js` builds the creek, garden footbridge and animated falling-water curtain; no waterfall image or downloaded model is used. The test range's anemometer and progress station are original geometry.

## Reference lighting pass — 2026-11-02

Reference: [Bruno Simon's folio-2025](https://github.com/brunosimon/folio-2025), reviewed at commit `41046b57eeed8d156d9c3fd7fa259900baef7816` (MIT, copyright Bruno Simon 2025). The review covered `MeshDefaultMaterial.js`, `Ligthing.js`, `Rendering.js`, `Fog.js`, `Terrain.js`, `View.js`, `DayCycles.js` and `cheapDOF.js`, followed by a live visual inspection. The downloaded reference remains outside this repository.

`art-direction.js` implements original GLSL lighting inspired by the reference's warm/cool colour separation, with a separate green shadow tint for foliage. `cinematic-pass.js` implements a small bloom, edge defocus and procedural sky gradient using local Three.js primitives. These modules do not copy the reference's TSL source, models, textures, branding or scene. Tree crowns now consist of fine faceted leaves; `meadows.js` generates grass and rock gardens with road and water clearance. The old generated sky bitmaps are preserved for provenance but are no longer requested by the page.

## Model and archipelago pass — 2026-11-03

The revised rover, maker benches, chair, server racks, radio desk, parabolic antenna and CubeSat are original native geometry. Rounded shells use a shared beveled primitive; wheel assemblies and the camera head remain separate moving parts. The telescope, orrery, turbine blades, battery, bowling lane, pins and ball are likewise generated from local geometry. The star chart is an original procedural canvas texture. The bowling simulation uses local deterministic code; it does not load a third-party physics library. No reference models, downloaded textures or generated scene bitmaps were added for this pass.

## Revised sky — 2026-11-01 (historical asset)

File: `pixel-sky-soft.png`. Created with the built-in Image Gen tool, using `docs/design/island-approved.png` as the image reference. Source generation: `exec-8aee91cf-013f-4bf6-92fb-c975c449c2b1.png`.

> Create ONLY a wide landscape game SKY BACKGROUND asset from the sky in the reference image. Remove the island and all objects and text entirely. Match exactly the reference's delicate pale powder blue sky, warm ivory blocky pixel cloud clusters and soft subtly peach shadows. Wide 16:10. Clouds mostly around outside edges, clear central sky, restrained contrast, luminous pastel blue, no saturated cyan. Flat illustrated pixel sky, softly textured, crisp stepped cloud silhouettes at a modest pixel size. No sun disc, no land, no water, no objects, no interface, no letters. This will be placed behind an actual 3D island, so the sky must stay quiet and airy. Full bleed artwork.
