First time Agent user 

Did like 2-4 prompts with Conductor and here are all the implementations that I have done :

- Code made completely using Javascript and html.
- Car was modeled and generated from scrach with GPT5.5 in High.
- Physics are kinda heavy... Like a real car.
- Game is playable directly in browser using this link "https://abidouul.github.io/car-drift/"
- Gave the game a working Menu with working settings which you can: 
  - Enable/Disable Shadows (still haven't poven if it helps with performance)
-...
-...

## Build note

The production build intentionally splits Three.js into a separate vendor chunk. The
Three chunk is a little above 500 kB minified, so Vite's chunk warning limit is set
to 550 kB while the game code remains in a much smaller app chunk.
