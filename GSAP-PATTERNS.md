# Think in motion: a guide to designing GSAP interactions

This is not a list of effects to memorize. It is a way to derive the code from the experience you want someone to have.

## First, what is actually in this project?

There are only two JavaScript examples here, and they are two different motion models:

| Example | What the person does | What the code does |
| --- | --- | --- |
| [Before/after slider](./Draggable%20%26%20inertia/index.html) | Moves a handle directly | Draggable controls the handle's x-position; the code measures it and maps that position to the revealed layer's width. |
| [Free drag](./Draggable%20%26%20inertia/dragScript.js) | Moves a box in two directions | Draggable controls x and y, with inertia requested for release. |

The [stylesheet](./Draggable%20%26%20inertia/style.css) contains styles for a horizontal and a large/vertical box state, but the repository does not currently include matching markup or JavaScript that toggles those states. So don't treat that CSS as a working FLIP example.

This is a useful distinction: code that looks different often differs because the *motion problem* differs. The skill is to identify the problem before choosing the GSAP technique.

## The director's questions

Before writing code, picture the moment as if you were directing a tiny scene. Answer these questions in plain language:

1. **What should the person notice or feel?** Curiosity, control, surprise, confidence, play?
2. **What is the subject?** A card, image, word, cursor, whole section?
3. **What changes?** Position, scale, rotation, opacity, reveal, layout, or several together?
4. **What causes the change?** Time, scroll progress, pointer movement, drag, or a state change?
5. **What is the relationship between input and motion?** Does motion follow the input exactly, catch up smoothly, or happen on its own?
6. **What should be true at the beginning and end?** Describe both frames before choosing properties.

For example:

> “The visitor grabs the divider. The new image follows their hand exactly. A small label stays legible on either side. When the divider reaches an edge, the comparison reaches a true 0% or 100%.”

That short description already tells you more than “make a cool slider”: direct drag, one-axis movement, clipped reveal, labels above images, and a meaningful mapping with exact endpoints.

## Imagine the motion as a pipeline

```text
INTENT
  ↓  What should the visitor experience?
TRIGGER
  ↓  Time / scroll / pointer / drag / state change?
INPUT
  ↓  What value do we receive? (time, scroll progress, x, y, state)
MAPPING
  ↓  How does that input become motion? (direct, normalized, eased, staged)
OUTPUT
  ↓  What do we change? (transform, clip, opacity, layout, CSS state)
FEEDBACK
     How does the motion feel, and what happens at the limits?
```

When reading someone else's animation, trace this pipeline backwards and forwards. Find the trigger first, then ask what value it controls, then find the element/property that receives that value.

## Choose the motion model before the API

| If the motion should… | Think in… | Typical GSAP approach |
| --- | --- | --- |
| Play once after a page or element appears | A **sequence** | `gsap.timeline()` with `from()`, `to()`, and `fromTo()` |
| Advance and reverse with the page | **Scroll progress** | ScrollTrigger with `scrub` |
| Start when an element enters view, then finish by itself | A **triggered sequence** | ScrollTrigger with a timeline and no `scrub` |
| Follow a user's hand precisely | **Direct manipulation** | Draggable callbacks and `gsap.set()` |
| Follow the pointer, but with a soft lag | **Smoothed input** | Pointer events plus `gsap.quickTo()` or a ticker |
| Move between two different layouts | **Before/after state** | Change state, then animate the layout change with Flip |

These are different answers to “who owns progress?” In a scrubbed scene, scroll owns progress. In a slider, the user's hand owns progress. In a timeline, time owns progress. Choose the owner first; then the implementation gets easier.

## The key choice: what does the number mean?

Animations often become confusing when a value has no clear meaning. Give it a name and define its range:

```text
progress = 0     → reveal is fully closed
progress = 0.5   → reveal is halfway open
progress = 1     → reveal is fully open
```

Then map it to whatever the design needs:

```text
progress → x position
progress → width percentage
progress → clip-path inset
progress → image scale
progress → label color
```

The input can be measured in pixels while the output is a percentage. That is not inconsistency; it is a conversion between two useful coordinate systems.

### Choose units based on the question

| Use… | When the design question is… | Example |
| --- | --- | --- |
| **Pixels / measured geometry** | “Where is this element in the actual rendered page?” | `getBoundingClientRect()` to compare the handle center to the frame. |
| **Normalized progress (`0–1`)** | “How far through the interaction are we, regardless of the frame's size?” | Map drag or scroll position to a reusable progress value. |
| **Percentages** | “What share of this parent should be revealed?” | `width: "42%"`; adapts naturally to container size. |
| **Transforms (`x`, `y`, `scale`, `rotation`)** | “How should this element visually move without changing document layout?” | Drag a handle with `type: "x"` or animate a card's `y`. |
| **CSS classes / layout properties** | “Did the element change structural state?” | A compact card becomes an expanded card; use CSS for the state, then animate the transition. |

Use the unit that naturally describes the output, not the unit that happened to arrive from the input.

## A real code-reading walkthrough: the comparison slider

Open [the slider implementation](./Draggable%20%26%20inertia/index.html) and follow the data, not every line at once:

```text
compareHandle ──drag x──> handle's rendered center
                                  │
compare frame ──measure───────────┘
                                  ↓
                      normalized progress (0–1)
                                  ↓
                     compareAfter width (0–100%)
```

Now each decision has a reason:

- `type: "x"`: the visual control should travel horizontally, not vertically.
- `bounds: compare`: the handle must remain within the comparison frame.
- `getBoundingClientRect()`: the calculation needs actual rendered geometry.
- Handle **center**: the reveal edge should align with the middle of the visible divider.
- `clamp(0, 1, ...)`: the mapped value must stay within its meaningful range.
- `gsap.set()`: during a drag, the revealed edge should respond immediately, not chase the hand.
- Percentage output: the reveal should scale with the frame's width.

### One important endpoint detail

The current slider divides the handle center's offset by the *entire* frame width. But the handle center cannot reach the frame's exact left or right edge if the handle has visible width. Therefore the reveal won't quite reach exactly 0% or 100%.

If exact endpoints matter, normalize across the handle's *legal center travel* instead:

```js
const minCenter = frameRect.left + handleRect.width / 2;
const maxCenter = frameRect.right - handleRect.width / 2;
const handleCenter = handleRect.left + handleRect.width / 2;

const progress = gsap.utils.clamp(
  0,
  1,
  (handleCenter - minCenter) / (maxCenter - minCenter)
);
```

This is a design decision, not a universal formula. If the reveal edge should align with the divider center and the divider is allowed to overhang the frame, use a different visual/constraint setup. First decide what “fully open” should look like; then calculate the range that makes it true.

## How to design a more expressive slider

Start with a motion brief, not an effect:

```text
Feeling: tactile and editorial, not like a settings control.
Resting frame: handle is visible; both images are composed and readable.
On grab: handle gains emphasis; cursor changes; no delayed following.
While moving: image edge follows the handle; labels remain readable.
On release: the handle stays exactly where released (for now).
At limits: reveal can reach true before and after states.
```

Translate that into layers and responsibilities:

```text
comparison frame (clips everything)
├── before image (full frame)
├── after image (full-size content, clipped by a reveal layer)
├── labels (above the images)
└── handle (above everything; only this element is draggable)
```

Then build in this order:

1. **Make the static composition work.** Correct image crops, clipping, stacking, responsive frame dimensions, and readable labels. Don't animate a broken layout.
2. **Make the simplest interaction work.** Drag the handle; map its center to progress; update the reveal. No flourish yet.
3. **Check the extremes.** Test start, midpoint, end, narrow screens, and resize. Decide whether exact endpoints or alignment is more important.
4. **Add one layer of feedback.** For example, enlarge the handle while pressed or change a label as it crosses the center. Keep feedback connected to the action.
5. **Add entrance choreography separately.** A timeline can reveal the heading, frame, and handle on load. Keep this separate from the drag callback: time owns the entrance; the hand owns the comparison.
6. **Tune the feeling.** Adjust duration/ease on the entrance, drag resistance on the interaction, and spacing/stagger on the composition. Don't add motion just because a property can move.

That separation is important: **continuous input should usually update directly; independent flourishes should use timelines.** If every pointer event starts a new tween for the handle, it can lag behind and feel disconnected. Use `gsap.set()` for exact tracking; reserve `gsap.to()` for a deliberate transition, such as a release or snap.

## Think in layers: composition, choreography, interaction

High-quality motion is not just a clever tween. Think through three layers:

### 1. Composition — what exists in the frame?

Decide what overlaps what, what is clipped, what remains fixed, and what changes size. Use HTML/CSS to make the still frame convincing. In the project slider, the frame clips both image layers and the handle sits above them.

### 2. Choreography — in what order does attention move?

Decide what the eye should see first, next, and last. A timeline expresses relationships:

```js
const intro = gsap.timeline({ defaults: { ease: "power3.out" } });

intro
  .from(".eyebrow", { y: 12, autoAlpha: 0, duration: 0.45 })
  .from(".title", { y: 36, autoAlpha: 0, duration: 0.7 }, "-=0.2")
  .from(".compare", { y: 24, autoAlpha: 0, duration: 0.6 }, "-=0.25")
  .from(".compare-handle", { scale: 0, duration: 0.4 }, "-=0.15");
```

The position arguments create intentional overlap. A timeline makes the sequence readable as one scene; avoid unrelated timers when timing relationships matter.

### 3. Interaction — how does the visitor affect the scene?

Define what is draggable, the allowed range, the input-to-output mapping, and feedback during/after the gesture. Keep those responsibilities separate from the entrance sequence so the interaction remains understandable.

## A practical build order for a new animation

Use this sequence for a new idea, whether it's a slider, card transition, scroll scene, or hero:

1. **Write the experience in one sentence.**
2. **Sketch the start frame and end frame.** Include what's fixed and what's moving.
3. **Name the trigger and progress owner:** time, scroll, pointer/drag, or state change.
4. **List the visual properties that change.** Prefer a small number of meaningful changes.
5. **Build the static HTML/CSS composition.**
6. **Make one motion work without polish.** Prove the core mapping/sequence first.
7. **Add constraints and edge cases.** Bounds, responsive resize, interruption, reverse, reduced motion.
8. **Add choreography and feedback.** Stagger, overlap, easing, hover/pressed states.
9. **Test at real sizes and real speeds.** Does the motion explain the interface, or distract from it?
10. **Remove motion that doesn't improve understanding, emotion, or feedback.**

## How to study a developer's animation code

Don't start by copying the GSAP object. Annotate the code with these questions:

```text
TRIGGER: What starts or advances this?
SUBJECT: Which elements are actually animated?
OWNER: Does time, scroll, pointer, or state control progress?
INPUT: Where does that progress/value come from?
MAPPING: Is it direct, normalized, clamped, snapped, eased, or staged?
OUTPUT: Which properties or layout states change?
BOUNDARIES: What happens at the beginning, end, resize, or interruption?
```

Then summarize the effect in one sentence without code. If you can't explain what the input means or why a value is a percentage versus pixels, trace that value backward until you find its source.

### A small example of reading from code back to intent

```js
gsap.set(reveal, { width: `${progress * 100}%` });
```

Don't memorize “multiply by 100.” Ask:

1. What is `progress`? A number between `0` and `1`.
2. Why multiply by `100`? CSS percentage is expressed from `0%` to `100%`.
3. Why set `width`? The desired visual output is a horizontal reveal.
4. Why `set`? It is updated continuously from direct user input.

Now you can derive an equivalent output for another design: use `clipPath`, an x-position, a color interpolation, or several coordinated properties while keeping the same meaningful `progress`.

## A memory model worth keeping

```text
FEEL → FRAME → TRIGGER → PROGRESS → MAPPING → MOTION → FEEDBACK
```

Or, as questions:

> **What should it feel like? What is on screen? What drives it? What does progress mean? How does progress map to visuals? What happens at the edges?**

Memorize those questions, not somebody else's numbers. The numbers change from design to design; the reasoning transfers.

## Practice prompts

For each prompt, write the motion brief and answer the memory questions before touching GSAP:

1. **Vertical reveal:** turn the comparison into a top/bottom wipe. Which measured values and CSS dimension change?
2. **Scroll-led product story:** a product stays pinned while three captions change its pose. Who owns progress? What are the scene's states?
3. **Card expands into detail:** is this ordinary movement or a layout transition? What changes structurally?
4. **Cursor-following decoration:** should it attach exactly to the pointer or trail behind? Which technique matches that feeling?
5. **Horizontal story slider:** is the user dragging freely, snapping between panels, or moving through scroll progress? These are different interaction contracts; describe yours before implementing it.

For each one, first explain the motion in one sentence. Then draw the elements and layers. Only then choose the GSAP API.
