function getCoordsMax(coords, index) {
    const max = coords.map(x => {
        return x[index];
    })
        .reduce(function (a, b) {
            return Math.max(a, b);
        });
    return max;
}



function getFillCoords(flatCoords, numPoints) {
    const pointsInShape = [];
    let insidePoints;
    console.log(flatCoords, numPoints)
    const xMax = getCoordsMax(flatCoords, 0);
    const yMax = getCoordsMax(flatCoords, 1);

    while (pointsInShape.length < numPoints) {
        let points = [Math.random() * xMax, Math.random() * yMax];
        insidePoints = inside(points, flatCoords);
        if (insidePoints) {
            pointsInShape.push(points);
        }
    }
    return pointsInShape;
}

function getTotalLengthAllPaths(paths) {
    return Array.from(paths).reduce((prev, curr) => {
        return prev + curr.getTotalLength();
    }, 0);
}

function inside(point, vs) {
    // algorithm via https://github.com/substack/point-in-polygon
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
    const x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i][0], yi = vs[i][1];
        const xj = vs[j][0], yj = vs[j][1];
        const intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
}


//Thank you Rich!! https://pathologist.surge.sh/
function pathologize (original) {

  //handles issues with pathologist not parsing text and style elements
  const reText = /<text[\s\S]*?<\/text>/g;
  const reStyle = /<style[\s\S]*?<\/style>/g;
  const removedText = original.replace(reText, '');
  const removedStyle = removedText.replace(reStyle, '');

  try {
    const pathologized = pathologist.transform(removedStyle);
    return pathologized;
  } catch (e)  {
    return original;
  }
}

function pathsToCoords ( paths, scale, numPoints, translateX, translateY ) {
    const totalLengthAllPaths = getTotalLengthAllPaths( paths );
    console.log(paths)
    let runningPointsTotal = 0;
    const separatePathsCoordsCollection = Array.from(paths).reduce((prev, item, index) => {
      let pointsForPath;
      if (index + 1 === paths.length) {
        //ensures that the total number of points = the actual requested number (because using rounding)
        pointsForPath = numPoints - runningPointsTotal;
      } else {
        pointsForPath = Math.round(numPoints * item.getTotalLength() / totalLengthAllPaths);
        runningPointsTotal += pointsForPath;
      }
      console.log(pointsForPath)
      return [...prev, ...polygonize(item, pointsForPath, scale, translateX, translateY)];
    }, []);
    console.log(separatePathsCoordsCollection)
    return separatePathsCoordsCollection;
  }

function polygonize (path, numPoints, scale, translateX, translateY) {
    //Thank you Noah!! http://bl.ocks.org/veltman/fc96dddae1711b3d756e0a13e7f09f24
  
    const length = path.getTotalLength();
  
    return [...new Array(abs(numPoints)).keys()].map(function(i) {
      const point = path.getPointAtLength(length * i / numPoints);
      return [point.x * scale + translateX, point.y * scale + translateY];
    });
  }