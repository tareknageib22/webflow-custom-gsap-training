const box = document.querySelector("#box");
const heading = document.querySelector(".h1");


Draggable.create({box, heading},{
  type:'x,y',
  inertia:true,
})

console.log(box)