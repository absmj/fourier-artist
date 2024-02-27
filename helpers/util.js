const gcd = (a, b) => {
    return b
        ? gcd(b, a % b)
        : a;
};

const aspectRatio = (width, height, toString=false) => {
    const divisor = gcd(width, height);

    return !toString ? [width / divisor, height / divisor] : `${width / divisor}:${height / divisor}`;
};

const area = (w, h) => w * h 