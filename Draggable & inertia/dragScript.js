const box = document.querySelector("#box");

Draggable.create(box,{
  type:'x,y',
  inertia:true,
})