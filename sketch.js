
let index = 0;
let sketch = {
  data: sketchData,

  get color() {
    return this.data.options.color == 'random' ? 
       this.data.p5.color(`rgb(${Math.round(Math.random()*255)}, ${Math.round(Math.random()*255)}, ${Math.round(Math.random()*255)})`)
      : this.data.p5.color(this.data.options.color)
  },

  optimize: {
    center(canvas, svg) {
      const s = this.scale(canvas,svg)
      const a = aspectRatio(canvas.width, canvas.height)
      const b = aspectRatio(svg.width, svg.height)

      console.log(a, b)
      // console.log(b[0] / b[1])
      svg.width *= s
      svg.height *= s

      return {
        x: canvas.width - (svg.width / 2),
        y: canvas.height - (svg.height / 2)
      }
    },

    scale(canvas, svg) {
      return Math.floor((canvas.area / svg.area) / 100)
    }
  },

  mount() {
    if(this.data.p5) {
      index = 0;
      this.data.path = []
      this.data.time = 0
      this.data.p5.coordinate()
      this.data.p5.clear()
      this.data.p5.loop()

    } else {
      new p5(this.drawMachine, 'canvasHolder')
    }
  },

  coordinates(coordinate) {
    try {
      index = 0;
      this.data.finished = false;
      const canvasEl = document.getElementById("canvasHolder")
      this.data.canvas.width = canvasEl.offsetWidth
      this.data.canvas.height = canvasEl.offsetHeight
      this.data.pathCoordinates = new Array();
      const svgContainer = document.querySelector('#svg-content');
      const svgContainerOriginal = document.querySelector('#svg-content-org');
      this.data.svg.original = coordinate;
      this.data.svg.pathologize = pathologize(coordinate);

      svgContainerOriginal.innerHTML = this.data.svg.original;
      this.data.svg.width = svgContainerOriginal.children[0].getAttribute('width');
      this.data.svg.height = svgContainerOriginal.children[0].getAttribute('height');

      this.scale = this.optimize.scale(this.data.canvas,this.data.svg)
      this.transform = this.optimize.center(this.data.canvas, this.data.svg)

      svgContainer.innerHTML = this.data.svg.pathologize
      this.data.svg.el = document.querySelector('#svg-content-org > svg')
      this.data.svg.el.setAttribute('width', '200')
      this.data.svg.el.setAttribute('height', '200')
      const paths = document.querySelectorAll('#svg-content * path')
      if(this.data.seperate)
        this.data.pathCoordinates = pathsToCoords(paths, this.data.scale, this.data.waveCount, this.data.transform.x, this.data.transform.y, this.data.seperate)
      else
        this.data.pathCoordinates[0] = pathsToCoords(paths, this.data.scale, this.data.waveCount, this.data.transform.x, this.data.transform.y, this.data.seperate)

      return this;
    } catch(e) {
      console.error(e)
    }
  },

  set index(index) {
    this.data.currentIndex = index;
  },
  
  get drawMachine() {
    return p5 => {

      p5.coordinate = () => {
        const skip = 1;
        this.data.x = [];
        for (let i = 0; i < this.data.pathCoordinates[index].length; i += skip) {
          const coord = this.data.pathCoordinates[index][i]
          const c = new Complex(coord[0], coord[1]);
          c.color = this.color
          this.data.x.push(c);
        }
        // currentImage = this.data.images[index]

        this.data.fourierX = dft(this.data.x, this.data.p5).map(v => ({...v, color: this.color}));
        this.data.fourierX.sort((a, b) => b.amp - a.amp);

   
      }

      p5.grid = () => {
        p5.push();
        p5.drawingContext.setLineDash([5,5])
        for(let w = 0; w < this.data.canvas.width; w+=this.data.canvas.width/10) {
          for(let h = 0; h < this.data.canvas.height; h+=this.data.canvas.height/10) {
            p5.stroke(0, 20);
            p5.strokeWeight(1);
            p5.line(w, 0, w, this.data.canvas.height);
            p5.line(0, h, this.data.canvas.width, h);
          }
        }
        p5.pop();
      }

      p5.coordinateSystem = () => {
        p5.push()
        p5.fill(0)
        
        // p5.line(0, 0, 0, this.data.canvas.height)
        p5.line(20, 0, 20, this.data.canvas.height)
        p5.line(0, this.data.canvas.height - 20, this.data.canvas.width, this.data.canvas.height - 20)
        p5.triangle(20,10,15,20,25,20)
        p5.triangle(this.data.canvas.width - 10,this.data.canvas.height - 20,this.data.canvas.width - 20,this.data.canvas.height - 15,this.data.canvas.width - 20,this.data.canvas.height - 25)

        p5.pop()
      }

      p5.preload = () => {
        this.data.p5 = p5
      }
    
      p5.setup = () => {
        p5.createCanvas(this.data.canvas.width, this.data.canvas.height);

        p5.coordinate()

        // currentImage = this.data.p5.createGraphics(this.data.canvas.width, this.data.canvas.height)
      }
    
      p5.draw =  () => {
        this.data.p5.background(this.data.options.background)
        if(this.data.options.show.axis) p5.coordinateSystem();
        const {x, y} = this.fourier()
        if(this.data.options.show.coordinate) {
          p5.textSize(18)
          p5.textAlign(p5.RIGHT);
          p5.text(`x: ${x.toFixed(2)}\ny: ${y.toFixed(2)}`, this.data.canvas.width - 20, 36)
        }

        p5.translate(this.data.transform.x, this.data.transform.y)
        p5.scale(this.data.scale)

        if(this.data.options.show.grid) p5.grid();
        
        const dt = p5.TWO_PI / this.data.fourierX.length;
        this.data.time += dt;

        // p5.noLoop()
        // return;
        if (this.data.time > p5.TWO_PI) {
          this.data.time = 0;
          if(this.data.seperate) {
            if(index < this.data.pathCoordinates.length - 1) {    
                index += 1;
                p5.coordinate()     
            } else {
              this.data.finished = true
            }
          } else {
            this.data.finished = true
          }



          // this.data.path = [];

          // p5.noLoop()
        }
      }
    }
  },

  fourier() {

    this.data.p5.push()
    let v = this.epicycles(this.data.p5.width / 8, this.data.p5.height / 8, 0, this.data.fourierX, this.data.p5);
    this.data.path.unshift(v);
    
    
    this.data.p5.strokeWeight(this.data.options.dots.radius)
    this.data.p5.beginShape(this.data.options.dots.active ? this.data.p5.POINTS : this.data.p5.LINES);

    // this.data.p5.noFill();
    for (let i = 0; i < this.data.path.length; i++) {
      this.data.p5.stroke(this.color,100)
      this.data.p5.vertex(this.data.path[i].x, this.data.path[i].y);
    }
    this.data.p5.endShape();
    this.data.p5.pop();
    return v
  },

  epicycles(x, y, rotation, fourier, p5) {
    for (let i = 0; i < fourier.length; i++) {
      let prevx = x;
      let prevy = y;
      let freq = fourier[i].freq;
      let radius = fourier[i].amp;
      let phase = fourier[i].phase;
      x += radius * p5.cos(freq * this.data.time + phase + rotation);
      y += radius * p5.sin(freq * this.data.time + phase + rotation);
  
      // if (this.data.time > p5.TWO_PI) {
      //   // this.data.time = 0;
      //   break;
      // }
  
      if(!this.data.finished){
        p5.stroke(fourier[i].color, this.data.options.ellipseStroke.opacity);
        p5.noFill();
        p5.ellipse(prevx, prevy, radius * 2);

        p5.stroke(fourier[i].color, this.data.options.lineStroke.opacity);
        p5.line(prevx, prevy, x, y);
      } else {
        this.data.p5.noLoop()
      }
    }
    return p5.createVector(x, y);
  },

}