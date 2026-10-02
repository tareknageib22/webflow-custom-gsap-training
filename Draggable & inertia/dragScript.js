const testBox = document.querySelector(".gsap-test");

Draggable.create(testBox, {
  type: "x,y",
  inertia: true,
});

console.log("hi this is the test box:", testBox);