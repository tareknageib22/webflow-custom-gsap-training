// const box = document.querySelector("#box");
const circleWrapper = document.querySelector(".gsap-test");


Draggable.create({circleWrapper},{
  type:'x,y',
  inertia:true,
})


console.log("hi this is the circle wrapper:", circleWrapper)

