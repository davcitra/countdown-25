export class Emoji {
    constructor(n,size){

        this.size=size
        this.factor = n
        scale : this.factor;
        this.emoji=n
        if (this.emoji=1){
            this.positionX = 3*canvas.width/4
            this.positionY = canvas.height/2
        } else {
            this.positionX = canvas.width/4
            this.positionY = canvas.height/2
        }
        

    }

    updatePos(){
        this.positionX = mouseX - this.positionX
        this.positionY = mouseY -this.positionY
    }

    // state(i){
    //     if(i=0)
    // }
   



}