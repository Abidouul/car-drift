First time Agent user 

Did like 2-4 prompts with Conductor and here are all the implementations that I have done :

- Code made completely using Javascript and html.
- Car was modeled and generated from scrach with GPT5.5 in High.
- Physics are kinda heavy... Like a real car.
- Game is playable directly in browser using this link "https://abidouul.github.io/car-drift/"
- Gave the game a working Menu with working settings which you can:
  - Enable/Disable shadows and tune shadow quality.
  - Modify keybinds for car steering.
  - Select graphics quality presets: High, Medium, Low, and Lowest.
  - Adjust resolution scale from 240p to 1080p.
  - Select shadow quality: High, Medium, Low, or Off.
  - Activate/Deactivate engine sound.
  - Limit Framerate to 30,45,60 or Unlimited.

- Optimized the game to use less RAM and CPU.
- Optimized the game to use more GPU power than RAM and CPU power.
- Replaced real shadows with lighter fake/disabled shadow options on low settings.
- Implementation of generated Sound for the engine (subject open for much better amelioration...)
- Added Score like Drift Points.
- Added Drift Multiplier. 
- Added a Timer.
- Modified Maps and made them more playable while copying games like CarX Drift Racing.
- Added Sense of speed because game felt Sluggish and slow.
- Added Object collisions.
- ...

Implementations that I wish to do in the future:

- Add Gameplay modes.
- Gameplay Ameliorations.
- Optimize more to make it smoothly run on a Celeron CPU.
- Sound Effects.
- Perfect the Car Model.
- Create more Car Models.
- Make a Car Selection Menu.
- Change Car Physics and make it more realistically heavy.
- Add More Environments with Multiple Maps.
- ...

Work can get taken and be customizable for now :)
Just trying to make something that I like.

## Build note

The production build intentionally splits Three.js into a separate vendor chunk. The
Three chunk is a little above 500 kB minified, so Vite's chunk warning limit is set
to 550 kB while the game code remains in a much smaller app chunk.

## Asset credits

- "2010 Vertex Edge Nissan S15 Silvia" 3D model by
  [Ddiaz Design](https://sketchfab.com/ddiaz-design), licensed under
  [CC-BY-NC-SA-4.0](http://creativecommons.org/licenses/by-nc-sa/4.0/).
  Source: <https://sketchfab.com/3d-models/2010-vertex-edge-nissan-s15-silvia-1edf4f37e6284bdaa6df0f9572389875>.
  Used in-game as the "Silvia S15 Vertex". Per the license this project must
  remain non-commercial.
