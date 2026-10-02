const hOne = document.querySelector(".h1");
const box = document.querySelector("#box");


Draggable.create(hOne,{
  type:'x,y',
  inertia:true,
})