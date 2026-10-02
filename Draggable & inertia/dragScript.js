// const box = document.querySelector("#box");
const circleWrapper = document.querySelector(".circle-wrapper");


Draggable.create({circleWrapper},{
  type:'x,y',
  inertia:true,
})


console.log("hi this is the circle wrapper:", circleWrapper)

