# Three.js runtime

Version: **0.183.2**, from the official `three` npm package.

- `three.module.js` and `three.core.js`: browser ES-module renderer and core.
- `OrbitControls.js`: official camera controls from `examples/jsm/controls/`.
- `addons/`: official EffectComposer, RenderPass, GTAOPass, OutputPass and their transitive modules, from the same 0.183.2 package. These provide multisampling, ambient occlusion and output colour conversion.
- `LICENSE`: upstream MIT license.

The island imports the runtime locally. Its import map resolves the controls' `three` import to the same module instance. No CDN or package installation is required to view the scene.
