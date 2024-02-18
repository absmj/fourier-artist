// Coding Challenge 130.3: Drawing with Fourier Transform and Epicycles
// Daniel Shiffman
// https://thecodingtrain.com/CodingChallenges/130.1-fourier-transform-drawing.html
// https://thecodingtrain.com/CodingChallenges/130.2-fourier-transform-drawing.html
// https://thecodingtrain.com/CodingChallenges/130.3-fourier-transform-drawing.html
// https://youtu.be/7_vKzcgpfvU


class Complex {
    constructor(a, b) {
        this.re = a;
        this.im = b;
    }

    add(c) {
        this.re += c.re;
        this.im += c.im;
    }

    mult(c) {
        const re = this.re * c.re - this.im * c.im;
        const im = this.re * c.im + this.im * c.re;
        return new Complex(re, im);
    }
}

function dft(x, p5) {
    const X = [];
    const N = x.length;
    for (let k = 0; k < N; k++) {
        let sum = new Complex(0, 0);
        for (let n = 0; n < N; n++) {
            const phi = (p5.TWO_PI * k * n) / N;
            const c = new Complex(p5.cos(phi), -p5.sin(phi));
            sum.add(x[n].mult(c));
        }
        sum.re = sum.re / N;
        sum.im = sum.im / N;

        let freq = k;
        let amp = p5.sqrt(sum.re * sum.re + sum.im * sum.im);
        let phase = p5.atan2(sum.im, sum.re);
        X[k] = { re: sum.re, im: sum.im, freq, amp, phase };
    }
    return X;
}
