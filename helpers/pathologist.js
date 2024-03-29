(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.pathologist = global.pathologist || {})));
  }(this, function (exports) { 'use strict';
  
    function getLocator ( source ) {
        var originalLines = source.split( '\n' );
  
        var start = 0;
        var lineRanges = originalLines.map( function ( line, i ) {
            var end = start + line.length + 1;
            var range = { start: start, end: end, line: i };
  
            start = end;
            return range;
        });
  
        var i = 0;
  
        function rangeContains ( range, index ) {
            return range.start <= index && index < range.end;
        }
  
        function getLocation ( range, index ) {
            return { line: range.line, column: index - range.start, character: index };
        }
  
        return function locate ( search, startIndex ) {
            if ( typeof search === 'string' ) {
                search = source.indexOf( search, startIndex || 0 );
            }
  
            var range = lineRanges[i];
  
            var d = search >= range.end ? 1 : -1;
  
            while ( range ) {
                if ( rangeContains( range, search ) ) return getLocation( range, search );
  
                i += d;
                range = lineRanges[i];
            }
        };
    }
  
    function locate ( source, search, startIndex ) {
        return getLocator( source )( search, startIndex );
    }
  
    var validNameCharacters = /[a-zA-Z0-9:-]/;
    var whitespace = /[\s\t\r\n]/;
    var quotemark = /['"]/;
  
    function repeat ( str, i ) {
        var result = '';
        while ( i-- ) result += str;
        return result;
    }
  
    function parse$1 ( source ) {
        var match = /^<\?.+?\?>/.exec( source );
        var metadata = match ? match[0] : '';
  
        var stack = [];
  
        var state = neutral;
        var currentElement = null;
        var root = null;
  
        function error ( message ) {
            var ref = locate( source, i );
            var line = ref.line;
            var column = ref.column;
            var before = source.slice( 0, i ).replace( /^\t+/, function (match) { return repeat( '  ', match.length ); } );
            var beforeLine = /(^|\n).*$/.exec( before )[0];
            var after = source.slice( i );
            var afterLine = /.*(\n|$)/.exec( after )[0];
  
            var snippet = "" + beforeLine + afterLine + "\n" + (repeat( ' ', beforeLine.length )) + "^";
  
            throw new Error( (message + " (" + line + ":" + column + "). If this is valid SVG, it's probably a bug in svg-parser. Please raise an issue at https://gitlab.com/Rich-Harris/svg-parser/issues – thanks!\n\n" + snippet) );
        }
  
        function neutral () {
            var text = '';
            while ( i < source.length && source[i] !== '<' ) text += source[ i++ ];
  
            if ( /\S/.test( text ) ) {
                currentElement.children.push( text );
            }
  
            if ( source[i] === '<' ) {
                return tag;
            }
  
            return neutral;
        }
  
        function tag () {
            if ( source[i] === '!' ) {
                return comment;
            }
  
            if ( source[i] === '/' ) {
                return closingTag;
            }
  
            var name = getName();
  
            var element = {
                name: name,
                attributes: {},
                children: []
            };
  
            if ( currentElement ) {
                currentElement.children.push( element );
            } else {
                root = element;
            }
  
            var attribute;
            while ( i < source.length && ( attribute = getAttribute() ) ) {
                element.attributes[ attribute.name ] = attribute.value;
            }
  
            var selfClosing = false;
  
            if ( source[i] === '/' ) {
                i += 1;
                selfClosing = true;
            }
  
            if ( source[i] !== '>' ) {
                error( 'Expected >' );
            }
  
            if ( !selfClosing ) {
                currentElement = element;
                stack.push( element );
            }
  
            return neutral;
        }
  
        function comment () {
            var index = source.indexOf( '-->', i );
            if ( !~index ) error( 'expected -->' );
  
            i = index + 3;
            return neutral;
        }
  
        function closingTag () {
            var name = getName();
  
            if ( !name ) error( 'Expected tag name' );
  
            if ( name !== currentElement.name ) {
                error( ("Expected closing tag </" + name + "> to match opening tag <" + (currentElement.name) + ">") );
            }
  
            if ( source[i] !== '>' ) {
                error( 'Expected >' );
            }
  
            stack.pop();
            currentElement = stack[ stack.length - 1 ];
  
            return neutral;
        }
  
        function getName () {
            var name = '';
            while ( i < source.length && validNameCharacters.test( source[i] ) ) name += source[ i++ ];
  
            return name;
        }
  
        function getAttribute () {
            if ( !whitespace.test( source[i] ) ) return null;
            allowSpaces();
  
            var name = getName();
            if ( !name ) return null;
  
            var value = true;
  
            allowSpaces();
            if ( source[i] === '=' ) {
                i += 1;
                allowSpaces();
  
                value = getAttributeValue();
                if ( !isNaN( value ) ) value = +value; // TODO whitelist numeric attributes?
            }
  
            return { name: name, value: value };
        }
  
        function getAttributeValue () {
            return quotemark.test( source[i] ) ?
                getQuotedAttributeValue() :
                getUnquotedAttributeValue();
        }
  
        function getUnquotedAttributeValue () {
            var value = '';
            do {
                var char = source[i];
                if ( char === ' ' || char === '>' || char === '/' ) {
                    return value;
                }
  
                value += char;
                i += 1;
            } while ( i < source.length );
  
            return value;
        }
  
        function getQuotedAttributeValue () {
            var quotemark = source[ i++ ];
  
            var value = '';
            var escaped = false;
  
            while ( i < source.length ) {
                var char = source[ i++ ];
                if ( char === quotemark && !escaped ) {
                    return value;
                }
  
                if ( char === '\\' && !escaped ) {
                    escaped = true;
                }
  
                value += escaped ? ("\\" + char) : char;
                escaped = false;
            }
        }
  
        function allowSpaces () {
            while ( i < source.length && whitespace.test( source[i] ) ) i += 1;
        }
  
        var i = metadata.length;
        while ( i < source.length ) {
            if ( !state ) error( 'Unexpected character' );
            state = state();
            i += 1;
        }
  
        if ( state !== neutral ) {
            error( 'Unexpected end of input' );
        }
  
        if ( root.name === 'svg' ) root.metadata = metadata;
        return root;
    }
  
    var assign = Object.assign || function assign ( source ) {
        var targets = [], len = arguments.length - 1;
        while ( len-- > 0 ) targets[ len ] = arguments[ len + 1 ];
  
        targets.forEach( function (target) {
            Object.keys( target ).forEach( function (key) {
                source[ key ] = target[ key ];
            });
        });
    };
  
    function cloneExcept ( obj, props ) {
        var clone = {};
        Object.keys( obj ).forEach( function (prop) {
            if ( !~props.indexOf( prop ) ) clone[ prop ] = obj[ prop ];
        });
        return clone;
    }
  
    function line ( points ) {
        var path = '';
        var prefix = 'M';
  
        for ( var i = 0; i < points.length; i += 2 ) {
            path += "" + prefix + (points[i]) + "," + (points[i+1]);
            prefix = ' ';
        }
  
        return path;
    }
  
    var converters = {
        ellipse: function (attributes) {
            var cx = attributes.cx || 0;
            var cy = attributes.cy || 0;
            var rx = attributes.rx || 0;
            var ry = attributes.ry || 0;
  
            var path = cloneExcept( attributes, [ 'cx', 'cy', 'rx', 'ry' ] );
            path.d = "M" + (cx - rx) + "," + cy + "a" + rx + "," + ry + " 0 1,0 " + (rx * 2) + ",0a" + rx + "," + ry + " 0 1,0 " + (rx * -2) + ",0";
  
            return path;
        },
  
        circle: function (attributes) {
            var cx = attributes.cx || 0;
            var cy = attributes.cy || 0;
            var r = attributes.r || 0;
  
            var path = cloneExcept( attributes, [ 'cx', 'cy', 'r' ] );
            path.d = "M" + (cx - r) + "," + cy + "a" + r + "," + r + " 0 1,0 " + (r * 2) + ",0a" + r + "," + r + " 0 1,0 " + (r * -2) + ",0";
  
            return path;
        },
  
        polygon: function (attributes) {
            var path = converters.polyline( attributes );
            path.d += 'Z';
  
            return path;
        },
  
        polyline: function (attributes) {
            var path = cloneExcept( attributes, 'points' );
            path.d = line( attributes.points.trim().split( /[\s,]+/ ) );
  
            return path;
        },
  
        rect: function (attributes) {
            var x = +attributes.x || 0;
            var y = +attributes.y || 0;
            var width = +attributes.width || 0;
            var height = +attributes.height || 0;
            // const rx = +attributes.rx || 0; // TODO handle...
            // const ry = +attributes.ry || 0; // TODO handle...
  
            var path = cloneExcept( attributes, [ 'x', 'y', 'width', 'height', 'rx', 'ry' ] );
  
            // TODO handle rx and ry
            path.d = "m" + x + "," + y + " " + width + ",0 0," + height + " " + (-width) + ",0Z";
  
            return path;
        },
  
        line: function (attributes) {
            var path = cloneExcept( attributes, [ 'x1', 'y1', 'x2', 'y2' ]);
            path.d = line([ attributes.x1 || 0, attributes.y1 || 0, attributes.x2 || 0, attributes.y2 || 0 ]);
  
            return path;
        }
  
        // TODO others...
    };
  
    function convert ( node ) {
        var converter = converters[ node.name ];
        if ( converter ) {
            var attributes = converter( node.attributes );
  
            return {
                name: 'path',
                attributes: attributes
            };
        }
  
        throw new Error( ("TODO <" + (node.name) + ">") );
    }
  
    function applyAttributes ( node, attributes ) {
        node.attributes = assign( attributes, node.attributes );
    }
  
    function applyClasses ( node, classes ) {
        if ( node.attributes.class ) {
            classes = assign( {}, classes );
  
            node.attributes.class.split( ' ' )
                .filter( Boolean )
                .forEach( function (className) { return classes[ className ] = true; } );
        }
  
        var classList = Object.keys( classes ).join( ' ' );
  
        if ( classList ) {
            node.attributes.class = classList;
        }
    }
  
    function interopDefault(ex) {
        return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex;
    }
  
    function createCommonjsModule(fn, module) {
        return module = { exports: {} }, fn(module, module.exports), module.exports;
    }
  
    var path_parse = createCommonjsModule(function (module) {
    'use strict';
  
  
    var paramCounts = { a: 7, c: 6, h: 1, l: 2, m: 2, r: 4, q: 4, s: 4, t: 2, v: 1, z: 0 };
  
    var SPECIAL_SPACES = [
      0x1680, 0x180E, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006,
      0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF
    ];
  
    function isSpace(ch) {
      return (ch === 0x0A) || (ch === 0x0D) || (ch === 0x2028) || (ch === 0x2029) || // Line terminators
        // White spaces
        (ch === 0x20) || (ch === 0x09) || (ch === 0x0B) || (ch === 0x0C) || (ch === 0xA0) ||
        (ch >= 0x1680 && SPECIAL_SPACES.indexOf(ch) >= 0);
    }
  
    function isCommand(code) {
      /*eslint-disable no-bitwise*/
      switch (code | 0x20) {
        case 0x6D/* m */:
        case 0x7A/* z */:
        case 0x6C/* l */:
        case 0x68/* h */:
        case 0x76/* v */:
        case 0x63/* c */:
        case 0x73/* s */:
        case 0x71/* q */:
        case 0x74/* t */:
        case 0x61/* a */:
        case 0x72/* r */:
          return true;
      }
      return false;
    }
  
    function isDigit(code) {
      return (code >= 48 && code <= 57);   // 0..9
    }
  
    function isDigitStart(code) {
      return (code >= 48 && code <= 57) || /* 0..9 */
              code === 0x2B || /* + */
              code === 0x2D || /* - */
              code === 0x2E;   /* . */
    }
  
  
    function State(path) {
      this.index  = 0;
      this.path   = path;
      this.max    = path.length;
      this.result = [];
      this.param  = 0.0;
      this.err    = '';
      this.segmentStart = 0;
      this.data   = [];
    }
  
    function skipSpaces(state) {
      while (state.index < state.max && isSpace(state.path.charCodeAt(state.index))) {
        state.index++;
      }
    }
  
  
    function scanParam(state) {
      var start = state.index,
          index = start,
          max = state.max,
          zeroFirst = false,
          hasCeiling = false,
          hasDecimal = false,
          hasDot = false,
          ch;
  
      if (index >= max) {
        state.err = 'SvgPath: missed param (at pos ' + index + ')';
        return;
      }
      ch = state.path.charCodeAt(index);
  
      if (ch === 0x2B/* + */ || ch === 0x2D/* - */) {
        index++;
        ch = (index < max) ? state.path.charCodeAt(index) : 0;
      }
  
      // This logic is shamelessly borrowed from Esprima
      // https://github.com/ariya/esprimas
      //
      if (!isDigit(ch) && ch !== 0x2E/* . */) {
        state.err = 'SvgPath: param should start with 0..9 or `.` (at pos ' + index + ')';
        return;
      }
  
      if (ch !== 0x2E/* . */) {
        zeroFirst = (ch === 0x30/* 0 */);
        index++;
  
        ch = (index < max) ? state.path.charCodeAt(index) : 0;
  
        if (zeroFirst && index < max) {
          // decimal number starts with '0' such as '09' is illegal.
          if (ch && isDigit(ch)) {
            state.err = 'SvgPath: numbers started with `0` such as `09` are ilegal (at pos ' + start + ')';
            return;
          }
        }
  
        while (index < max && isDigit(state.path.charCodeAt(index))) {
          index++;
          hasCeiling = true;
        }
        ch = (index < max) ? state.path.charCodeAt(index) : 0;
      }
  
      if (ch === 0x2E/* . */) {
        hasDot = true;
        index++;
        while (isDigit(state.path.charCodeAt(index))) {
          index++;
          hasDecimal = true;
        }
        ch = (index < max) ? state.path.charCodeAt(index) : 0;
      }
  
      if (ch === 0x65/* e */ || ch === 0x45/* E */) {
        if (hasDot && !hasCeiling && !hasDecimal) {
          state.err = 'SvgPath: invalid float exponent (at pos ' + index + ')';
          return;
        }
  
        index++;
  
        ch = (index < max) ? state.path.charCodeAt(index) : 0;
        if (ch === 0x2B/* + */ || ch === 0x2D/* - */) {
          index++;
        }
        if (index < max && isDigit(state.path.charCodeAt(index))) {
          while (index < max && isDigit(state.path.charCodeAt(index))) {
            index++;
          }
        } else {
          state.err = 'SvgPath: invalid float exponent (at pos ' + index + ')';
          return;
        }
      }
  
      state.index = index;
      state.param = parseFloat(state.path.slice(start, index)) + 0.0;
    }
  
  
    function finalizeSegment(state) {
      var cmd, cmdLC;
  
      // Process duplicated commands (without comand name)
  
      // This logic is shamelessly borrowed from Raphael
      // https://github.com/DmitryBaranovskiy/raphael/
      //
      cmd   = state.path[state.segmentStart];
      cmdLC = cmd.toLowerCase();
  
      var params = state.data;
  
      if (cmdLC === 'm' && params.length > 2) {
        state.result.push([ cmd, params[0], params[1] ]);
        params = params.slice(2);
        cmdLC = 'l';
        cmd = (cmd === 'm') ? 'l' : 'L';
      }
  
      if (cmdLC === 'r') {
        state.result.push([ cmd ].concat(params));
      } else {
  
        while (params.length >= paramCounts[cmdLC]) {
          state.result.push([ cmd ].concat(params.splice(0, paramCounts[cmdLC])));
          if (!paramCounts[cmdLC]) {
            break;
          }
        }
      }
    }
  
  
    function scanSegment(state) {
      var max = state.max, cmdCode, comma_found,
                need_params, i;
  
      state.segmentStart = state.index;
      cmdCode = state.path.charCodeAt(state.index);
  
      if (!isCommand(cmdCode)) {
        state.err = 'SvgPath: bad command ' + state.path[state.index] + ' (at pos ' + state.index + ')';
        return;
      }
  
      need_params = paramCounts[state.path[state.index].toLowerCase()];
  
      state.index++;
      skipSpaces(state);
  
      state.data = [];
  
      if (!need_params) {
        // Z
        finalizeSegment(state);
        return;
      }
  
      comma_found = false;
  
      for (;;) {
        for (i = need_params; i > 0; i--) {
          scanParam(state);
          if (state.err.length) {
            return;
          }
          state.data.push(state.param);
  
          skipSpaces(state);
          comma_found = false;
  
          if (state.index < max && state.path.charCodeAt(state.index) === 0x2C/* , */) {
            state.index++;
            skipSpaces(state);
            comma_found = true;
          }
        }
  
        // after ',' param is mandatory
        if (comma_found) {
          continue;
        }
  
        if (state.index >= state.max) {
          break;
        }
  
        // Stop on next segment
        if (!isDigitStart(state.path.charCodeAt(state.index))) {
          break;
        }
      }
  
      finalizeSegment(state);
    }
  
  
    /* Returns array of segments:
     *
     * [
     *   [ command, coord1, coord2, ... ]
     * ]
     */
    module.exports = function pathParse(svgPath) {
      var state = new State(svgPath);
      var max = state.max;
  
      skipSpaces(state);
  
      while (state.index < max && !state.err.length) {
        scanSegment(state);
      }
  
      if (state.err.length) {
        state.result = [];
  
      } else if (state.result.length) {
  
        if ('mM'.indexOf(state.result[0][0]) < 0) {
          state.err = 'SvgPath: string should start with `M` or `m`';
          state.result = [];
        } else {
          state.result[0][0] = 'M';
        }
      }
  
      return {
        err: state.err,
        segments: state.result
      };
    };
    });
  
    var path_parse$1 = interopDefault(path_parse);
  
  
    var require$$4 = Object.freeze({
      default: path_parse$1
    });
  
    var require$$4 = Object.freeze({
      default: path_parse$1
    });
  
    var matrix = createCommonjsModule(function (module) {
    'use strict';
  
    // combine 2 matrixes
    // m1, m2 - [a, b, c, d, e, g]
    //
    function combine(m1, m2) {
      return [
        m1[0] * m2[0] + m1[2] * m2[1],
        m1[1] * m2[0] + m1[3] * m2[1],
        m1[0] * m2[2] + m1[2] * m2[3],
        m1[1] * m2[2] + m1[3] * m2[3],
        m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
        m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
      ];
    }
  
  
    function Matrix() {
      if (!(this instanceof Matrix)) { return new Matrix(); }
      this.queue = [];   // list of matrixes to apply
      this.cache = null; // combined matrix cache
    }
  
  
    Matrix.prototype.matrix = function (m) {
      if (m[0] === 1 && m[1] === 0 && m[2] === 0 && m[3] === 1 && m[4] === 0 && m[5] === 0) {
        return this;
      }
      this.cache = null;
      this.queue.push(m);
      return this;
    };
  
  
    Matrix.prototype.translate = function (tx, ty) {
      if (tx !== 0 || ty !== 0) {
        this.cache = null;
        this.queue.push([ 1, 0, 0, 1, tx, ty ]);
      }
      return this;
    };
  
  
    Matrix.prototype.scale = function (sx, sy) {
      if (sx !== 1 || sy !== 1) {
        this.cache = null;
        this.queue.push([ sx, 0, 0, sy, 0, 0 ]);
      }
      return this;
    };
  
  
    Matrix.prototype.rotate = function (angle, rx, ry) {
      var rad, cos, sin;
  
      if (angle !== 0) {
        this.translate(rx, ry);
  
        rad = angle * Math.PI / 180;
        cos = Math.cos(rad);
        sin = Math.sin(rad);
  
        this.queue.push([ cos, sin, -sin, cos, 0, 0 ]);
        this.cache = null;
  
        this.translate(-rx, -ry);
      }
      return this;
    };
  
  
    Matrix.prototype.skewX = function (angle) {
      if (angle !== 0) {
        this.cache = null;
        this.queue.push([ 1, 0, Math.tan(angle * Math.PI / 180), 1, 0, 0 ]);
      }
      return this;
    };
  
  
    Matrix.prototype.skewY = function (angle) {
      if (angle !== 0) {
        this.cache = null;
        this.queue.push([ 1, Math.tan(angle * Math.PI / 180), 0, 1, 0, 0 ]);
      }
      return this;
    };
  
  
    // Flatten queue
    //
    Matrix.prototype.toArray = function () {
      var this$1 = this;
  
      if (this.cache) {
        return this.cache;
      }
  
      if (!this.queue.length) {
        this.cache = [ 1, 0, 0, 1, 0, 0 ];
        return this.cache;
      }
  
      this.cache = this.queue[0];
  
      if (this.queue.length === 1) {
        return this.cache;
      }
  
      for (var i = 1; i < this.queue.length; i++) {
        this$1.cache = combine(this$1.cache, this$1.queue[i]);
      }
  
      return this.cache;
    };
  
  
    // Apply list of matrixes to (x,y) point.
    // If `isRelative` set, `translate` component of matrix will be skipped
    //
    Matrix.prototype.calc = function (x, y, isRelative) {
      var m, i, len;
  
      // Don't change point on empty transforms queue
      if (!this.queue.length) { return [ x, y ]; }
  
      // Calculate final matrix, if not exists
      //
      // NB. if you deside to apply transforms to point one-by-one,
      // they should be taken in reverse order
  
      if (!this.cache) {
        this.cache = this.toArray();
      }
  
      m = this.cache;
  
      // Apply matrix to point
      return [
        x * m[0] + y * m[2] + (isRelative ? 0 : m[4]),
        x * m[1] + y * m[3] + (isRelative ? 0 : m[5])
      ];
    };
  
  
    module.exports = Matrix;
    });
  
    var matrix$1 = interopDefault(matrix);
  
  
    var require$$0$1 = Object.freeze({
      default: matrix$1
    });
  
    var require$$0$1 = Object.freeze({
      default: matrix$1
    });
  
    var transform_parse = createCommonjsModule(function (module) {
    'use strict';
  
  
    var Matrix = interopDefault(require$$0$1);
  
    var operations = {
      matrix: true,
      scale: true,
      rotate: true,
      translate: true,
      skewX: true,
      skewY: true
    };
  
    var CMD_SPLIT_RE    = /\s*(matrix|translate|scale|rotate|skewX|skewY)\s*\(\s*(.+?)\s*\)[\s,]*/;
    var PARAMS_SPLIT_RE = /[\s,]+/;
  
  
    module.exports = function transformParse(transformString) {
      var matrix = new Matrix();
      var cmd, params;
  
      // Split value into ['', 'translate', '10 50', '', 'scale', '2', '', 'rotate',  '-45', '']
      transformString.split(CMD_SPLIT_RE).forEach(function (item) {
  
        // Skip empty elements
        if (!item.length) { return; }
  
        // remember operation
        if (typeof operations[item] !== 'undefined') {
          cmd = item;
          return;
        }
  
        // extract params & att operation to matrix
        params = item.split(PARAMS_SPLIT_RE).map(function (i) {
          return +i || 0;
        });
  
        // If params count is not correct - ignore command
        switch (cmd) {
          case 'matrix':
            if (params.length === 6) {
              matrix.matrix(params);
            }
            return;
  
          case 'scale':
            if (params.length === 1) {
              matrix.scale(params[0], params[0]);
            } else if (params.length === 2) {
              matrix.scale(params[0], params[1]);
            }
            return;
  
          case 'rotate':
            if (params.length === 1) {
              matrix.rotate(params[0], 0, 0);
            } else if (params.length === 3) {
              matrix.rotate(params[0], params[1], params[2]);
            }
            return;
  
          case 'translate':
            if (params.length === 1) {
              matrix.translate(params[0], 0);
            } else if (params.length === 2) {
              matrix.translate(params[0], params[1]);
            }
            return;
  
          case 'skewX':
            if (params.length === 1) {
              matrix.skewX(params[0]);
            }
            return;
  
          case 'skewY':
            if (params.length === 1) {
              matrix.skewY(params[0]);
            }
            return;
        }
      });
  
      return matrix;
    };
    });
  
    var transform_parse$1 = interopDefault(transform_parse);
  
  
    var require$$3 = Object.freeze({
      default: transform_parse$1
    });
  
    var require$$3 = Object.freeze({
      default: transform_parse$1
    });
  
    var a2c = createCommonjsModule(function (module) {
    // Convert an arc to a sequence of cubic bézier curves
    //
    'use strict';
  
  
    var TAU = Math.PI * 2;
  
  
    /* eslint-disable space-infix-ops */
  
    // Calculate an angle between two vectors
    //
    function vector_angle(ux, uy, vx, vy) {
      var sign = (ux * vy - uy * vx < 0) ? -1 : 1;
      var umag = Math.sqrt(ux * ux + uy * uy);
      var vmag = Math.sqrt(ux * ux + uy * uy);
      var dot  = ux * vx + uy * vy;
      var div  = dot / (umag * vmag);
  
      // rounding errors, e.g. -1.0000000000000002 can screw up this
      if (div >  1.0) { div =  1.0; }
      if (div < -1.0) { div = -1.0; }
  
      return sign * Math.acos(div);
    }
  
  
    // Convert from endpoint to center parameterization,
    // see http://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
    //
    // Return [cx, cy, θ1, Δθ]
    //
    function get_arc_center(x1, y1, x2, y2, fa, fs, rx, ry, sin_φ, cos_φ) {
      // Step 1.
      //
      // Moving an ellipse so origin will be the middlepoint between our two
      // points. After that, rotate it to line up ellipse axes with coordinate
      // axes.
      //
      var x1p =  cos_φ*(x1-x2)/2 + sin_φ*(y1-y2)/2;
      var y1p = -sin_φ*(x1-x2)/2 + cos_φ*(y1-y2)/2;
  
      var rx_sq  =  rx * rx;
      var ry_sq  =  ry * ry;
      var x1p_sq = x1p * x1p;
      var y1p_sq = y1p * y1p;
  
      // Step 2.
      //
      // Compute coordinates of the centre of this ellipse (cx', cy')
      // in the new coordinate system.
      //
      var radicant = (rx_sq * ry_sq) - (rx_sq * y1p_sq) - (ry_sq * x1p_sq);
  
      if (radicant < 0) {
        // due to rounding errors it might be e.g. -1.3877787807814457e-17
        radicant = 0;
      }
  
      radicant /=   (rx_sq * y1p_sq) + (ry_sq * x1p_sq);
      radicant = Math.sqrt(radicant) * (fa === fs ? -1 : 1);
  
      var cxp = radicant *  rx/ry * y1p;
      var cyp = radicant * -ry/rx * x1p;
  
      // Step 3.
      //
      // Transform back to get centre coordinates (cx, cy) in the original
      // coordinate system.
      //
      var cx = cos_φ*cxp - sin_φ*cyp + (x1+x2)/2;
      var cy = sin_φ*cxp + cos_φ*cyp + (y1+y2)/2;
  
      // Step 4.
      //
      // Compute angles (θ1, Δθ).
      //
      var v1x =  (x1p - cxp) / rx;
      var v1y =  (y1p - cyp) / ry;
      var v2x = (-x1p - cxp) / rx;
      var v2y = (-y1p - cyp) / ry;
  
      var θ1 = vector_angle(1, 0, v1x, v1y);
      var Δθ = vector_angle(v1x, v1y, v2x, v2y);
  
      if (fs === 0 && Δθ > 0) {
        Δθ -= TAU;
      }
      if (fs === 1 && Δθ < 0) {
        Δθ += TAU;
      }
  
      return [ cx, cy, θ1, Δθ ];
    }
  
    //
    // Approximate one unit arc segment with bézier curves,
    // see http://math.stackexchange.com/questions/873224
    //
    function approximate_unit_arc(θ1, Δθ) {
      var α = 4/3 * Math.tan(Δθ/4);
  
      var x1 = Math.cos(θ1);
      var y1 = Math.sin(θ1);
      var x2 = Math.cos(θ1 + Δθ);
      var y2 = Math.sin(θ1 + Δθ);
  
      return [ x1, y1, x1 - y1*α, y1 + x1*α, x2 + y2*α, y2 - x2*α, x2, y2 ];
    }
  
    module.exports = function a2c(x1, y1, x2, y2, fa, fs, rx, ry, φ) {
      var sin_φ = Math.sin(φ * TAU / 360);
      var cos_φ = Math.cos(φ * TAU / 360);
  
      // Make sure radii are valid
      //
      var x1p =  cos_φ*(x1-x2)/2 + sin_φ*(y1-y2)/2;
      var y1p = -sin_φ*(x1-x2)/2 + cos_φ*(y1-y2)/2;
  
      if (x1p === 0 && y1p === 0) {
        // we're asked to draw line to itself
        return [];
      }
  
      if (rx === 0 || ry === 0) {
        // one of the radii is zero
        return [];
      }
  
  
      // Compensate out-of-range radii
      //
      rx = Math.abs(rx);
      ry = Math.abs(ry);
  
      var Λ = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
      if (Λ > 1) {
        rx *= Math.sqrt(Λ);
        ry *= Math.sqrt(Λ);
      }
  
  
      // Get center parameters (cx, cy, θ1, Δθ)
      //
      var cc = get_arc_center(x1, y1, x2, y2, fa, fs, rx, ry, sin_φ, cos_φ);
  
      var result = [];
      var θ1 = cc[2];
      var Δθ = cc[3];
  
      // Split an arc to multiple segments, so each segment
      // will be less than τ/4 (= 90°)
      //
      var segments = Math.max(Math.ceil(Math.abs(Δθ) / (TAU / 4)), 1);
      Δθ /= segments;
  
      for (var i = 0; i < segments; i++) {
        result.push(approximate_unit_arc(θ1, Δθ));
        θ1 += Δθ;
      }
  
      // We have a bezier approximation of a unit circle,
      // now need to transform back to the original ellipse
      //
      return result.map(function (curve) {
        for (var i = 0; i < curve.length; i += 2) {
          var x = curve[i + 0];
          var y = curve[i + 1];
  
          // scale
          x *= rx;
          y *= ry;
  
          // rotate
          var xp = cos_φ*x - sin_φ*y;
          var yp = sin_φ*x + cos_φ*y;
  
          // translate
          curve[i + 0] = xp + cc[0];
          curve[i + 1] = yp + cc[1];
        }
  
        return curve;
      });
    };
    });
  
    var a2c$1 = interopDefault(a2c);
  
  
    var require$$1 = Object.freeze({
      default: a2c$1
    });
  
    var require$$1 = Object.freeze({
      default: a2c$1
    });
  
    var ellipse = createCommonjsModule(function (module) {
    'use strict';
  
    /* eslint-disable space-infix-ops */
  
    // The precision used to consider an ellipse as a circle
    //
    var epsilon = 0.0000000001;
  
    // To convert degree in radians
    //
    var torad = Math.PI / 180;
  
    // Class constructor :
    //  an ellipse centred at 0 with radii rx,ry and x - axis - angle ax.
    //
    function Ellipse(rx, ry, ax) {
      if (!(this instanceof Ellipse)) { return new Ellipse(rx, ry, ax); }
      this.rx = rx;
      this.ry = ry;
      this.ax = ax;
    }
  
    // Apply a linear transform m to the ellipse
    // m is an array representing a matrix :
    //    -         -
    //   | m[0] m[2] |
    //   | m[1] m[3] |
    //    -         -
    //
    Ellipse.prototype.transform = function (m) {
      // We consider the current ellipse as image of the unit circle
      // by first scale(rx,ry) and then rotate(ax) ...
      // So we apply ma =  m x rotate(ax) x scale(rx,ry) to the unit circle.
      var c = Math.cos(this.ax * torad), s = Math.sin(this.ax * torad);
      var ma = [ this.rx * (m[0]*c + m[2]*s),
                 this.rx * (m[1]*c + m[3]*s),
                 this.ry * (-m[0]*s + m[2]*c),
                 this.ry * (-m[1]*s + m[3]*c) ];
  
      // ma * transpose(ma) = [ J L ]
      //                      [ L K ]
      // L is calculated later (if the image is not a circle)
      var J = ma[0]*ma[0] + ma[2]*ma[2],
          K = ma[1]*ma[1] + ma[3]*ma[3];
  
      // the discriminant of the characteristic polynomial of ma * transpose(ma)
      var D = ((ma[0]-ma[3])*(ma[0]-ma[3]) + (ma[2]+ma[1])*(ma[2]+ma[1])) *
              ((ma[0]+ma[3])*(ma[0]+ma[3]) + (ma[2]-ma[1])*(ma[2]-ma[1]));
  
      // the "mean eigenvalue"
      var JK = (J + K) / 2;
  
      // check if the image is (almost) a circle
      if (D < epsilon * JK) {
        // if it is
        this.rx = this.ry = Math.sqrt(JK);
        this.ax = 0;
        return this;
      }
  
      // if it is not a circle
      var L = ma[0]*ma[1] + ma[2]*ma[3];
  
      D = Math.sqrt(D);
  
      // {l1,l2} = the two eigen values of ma * transpose(ma)
      var l1 = JK + D/2,
          l2 = JK - D/2;
      // the x - axis - rotation angle is the argument of the l1 - eigenvector
      this.ax = (Math.abs(L) < epsilon && Math.abs(l1 - K) < epsilon) ?
        90
      :
        Math.atan(Math.abs(L) > Math.abs(l1 - K) ?
          (l1 - J) / L
        :
          L / (l1 - K)
        ) * 180 / Math.PI;
  
      // if ax > 0 => rx = sqrt(l1), ry = sqrt(l2), else exchange axes and ax += 90
      if (this.ax >= 0) {
        // if ax in [0,90]
        this.rx = Math.sqrt(l1);
        this.ry = Math.sqrt(l2);
      } else {
        // if ax in ]-90,0[ => exchange axes
        this.ax += 90;
        this.rx = Math.sqrt(l2);
        this.ry = Math.sqrt(l1);
      }
  
      return this;
    };
  
    // Check if the ellipse is (almost) degenerate, i.e. rx = 0 or ry = 0
    //
    Ellipse.prototype.isDegenerate = function () {
      return (this.rx < epsilon * this.ry || this.ry < epsilon * this.rx);
    };
  
    module.exports = Ellipse;
    });
  
    var ellipse$1 = interopDefault(ellipse);
  
  
    var require$$0$2 = Object.freeze({
      default: ellipse$1
    });
  
    var require$$0$2 = Object.freeze({
      default: ellipse$1
    });
  
    var svgpath$1 = createCommonjsModule(function (module) {
    // SVG Path transformations library
    //
    // Usage:
    //
    //    SvgPath('...')
    //      .translate(-150, -100)
    //      .scale(0.5)
    //      .translate(-150, -100)
    //      .toFixed(1)
    //      .toString()
    //
  
    'use strict';
  
  
    var pathParse      = interopDefault(require$$4);
    var transformParse = interopDefault(require$$3);
    var matrix         = interopDefault(require$$0$1);
    var a2c            = interopDefault(require$$1);
    var ellipse        = interopDefault(require$$0$2);
  
  
    // Class constructor
    //
    function SvgPath(path) {
      if (!(this instanceof SvgPath)) { return new SvgPath(path); }
  
      var pstate = pathParse(path);
  
      // Array of path segments.
      // Each segment is array [command, param1, param2, ...]
      this.segments = pstate.segments;
  
      // Error message on parse error.
      this.err      = pstate.err;
  
      // Transforms stack for lazy evaluation
      this.__stack    = [];
    }
  
  
    SvgPath.prototype.__matrix = function (m) {
      var self = this,
          ma, sx, sy, angle, arc2line, i;
  
      // Quick leave for empty matrix
      if (!m.queue.length) { return; }
  
      this.iterate(function (s, index, x, y) {
        var p, result, name, isRelative;
  
        switch (s[0]) {
  
          // Process 'assymetric' commands separately
          case 'v':
            p      = m.calc(0, s[1], true);
            result = (p[0] === 0) ? [ 'v', p[1] ] : [ 'l', p[0], p[1] ];
            break;
  
          case 'V':
            p      = m.calc(x, s[1], false);
            result = (p[0] === m.calc(x, y, false)[0]) ? [ 'V', p[1] ] : [ 'L', p[0], p[1] ];
            break;
  
          case 'h':
            p      = m.calc(s[1], 0, true);
            result = (p[1] === 0) ? [ 'h', p[0] ] : [ 'l', p[0], p[1] ];
            break;
  
          case 'H':
            p      = m.calc(s[1], y, false);
            result = (p[1] === m.calc(x, y, false)[1]) ? [ 'H', p[0] ] : [ 'L', p[0], p[1] ];
            break;
  
          case 'a':
          case 'A':
            // ARC is: ['A', rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]
  
            // Drop segment if arc is empty (end point === start point)
            /*if ((s[0] === 'A' && s[6] === x && s[7] === y) ||
                (s[0] === 'a' && s[6] === 0 && s[7] === 0)) {
              return [];
            }*/
  
            // Transform rx, ry and the x-axis-rotation
            var ma = m.toArray();
            var e = ellipse(s[1], s[2], s[3]).transform(ma);
  
            // flip sweep-flag if matrix is not orientation-preserving
            if (ma[0] * ma[3] - ma[1] * ma[2] < 0) {
              s[5] = s[5] ? '0' : '1';
            }
  
            // Transform end point as usual (without translation for relative notation)
            p = m.calc(s[6], s[7], s[0] === 'a');
  
            // Empty arcs can be ignored by renderer, but should not be dropped
            // to avoid collisions with `S A S` and so on. Replace with empty line.
            if ((s[0] === 'A' && s[6] === x && s[7] === y) ||
                (s[0] === 'a' && s[6] === 0 && s[7] === 0)) {
              result = [ s[0] === 'a' ? 'l' : 'L', p[0], p[1] ];
              break;
            }
  
            // if the resulting ellipse is (almost) a segment ...
            if (e.isDegenerate()) {
              // replace the arc by a line
              result = [ s[0] === 'a' ? 'l' : 'L', p[0], p[1] ];
            } else {
              // if it is a real ellipse
              // s[0], s[4] and s[5] are not modified
              result = [ s[0], e.rx, e.ry, e.ax, s[4], s[5], p[0], p[1] ];
            }
  
            break;
  
          case 'm':
            // Edge case. The very first `m` should be processed as absolute, if happens.
            // Make sense for coord shift transforms.
            isRelative = index > 0;
  
            p = m.calc(s[1], s[2], isRelative);
            result = [ 'm', p[0], p[1] ];
            break;
  
          default:
            name       = s[0];
            result     = [ name ];
            isRelative = (name.toLowerCase() === name);
  
            // Apply transformations to the segment
            for (i = 1; i < s.length; i += 2) {
              p = m.calc(s[i], s[i + 1], isRelative);
              result.push(p[0], p[1]);
            }
        }
  
        self.segments[index] = result;
      }, true);
    };
  
  
    // Apply stacked commands
    //
    SvgPath.prototype.__evaluateStack = function () {
      var this$1 = this;
  
      var m, i;
  
      if (!this.__stack.length) { return; }
  
      if (this.__stack.length === 1) {
        this.__matrix(this.__stack[0]);
        this.__stack = [];
        return;
      }
  
      m = matrix();
      i = this.__stack.length;
  
      while (--i >= 0) {
        m.matrix(this$1.__stack[i].toArray());
      }
  
      this.__matrix(m);
      this.__stack = [];
    };
  
  
    // Convert processed SVG Path back to string
    //
    SvgPath.prototype.toString = function () {
      var this$1 = this;
  
      var elements = [], skipCmd, cmd;
  
      this.__evaluateStack();
  
      for (var i = 0; i < this.segments.length; i++) {
        // remove repeating commands names
        cmd = this$1.segments[i][0];
        skipCmd = i > 0 && cmd !== 'm' && cmd !== 'M' && cmd === this$1.segments[i - 1][0];
        elements = elements.concat(skipCmd ? this$1.segments[i].slice(1) : this$1.segments[i]);
      }
  
      return elements.join(' ')
                // Optimizations: remove spaces around commands & before `-`
                //
                // We could also remove leading zeros for `0.5`-like values,
                // but their count is too small to spend time for.
                .replace(/ ?([achlmqrstvz]) ?/gi, '$1')
                .replace(/ \-/g, '-')
                // workaround for FontForge SVG importing bug
                .replace(/zm/g, 'z m');
    };
  
  
    // Translate path to (x [, y])
    //
    SvgPath.prototype.translate = function (x, y) {
      this.__stack.push(matrix().translate(x, y || 0));
      return this;
    };
  
  
    // Scale path to (sx [, sy])
    // sy = sx if not defined
    //
    SvgPath.prototype.scale = function (sx, sy) {
      this.__stack.push(matrix().scale(sx, (!sy && (sy !== 0)) ? sx : sy));
      return this;
    };
  
  
    // Rotate path around point (sx [, sy])
    // sy = sx if not defined
    //
    SvgPath.prototype.rotate = function (angle, rx, ry) {
      this.__stack.push(matrix().rotate(angle, rx || 0, ry || 0));
      return this;
    };
  
  
    // Apply matrix transform (array of 6 elements)
    //
    SvgPath.prototype.matrix = function (m) {
      this.__stack.push(matrix().matrix(m));
      return this;
    };
  
  
    // Transform path according to "transform" attr of SVG spec
    //
    SvgPath.prototype.transform = function (transformString) {
      if (!transformString.trim()) {
        return this;
      }
      this.__stack.push(transformParse(transformString));
      return this;
    };
  
  
    // Round coords with given decimal precition.
    // 0 by default (to integers)
    //
    SvgPath.prototype.round = function (d) {
      var contourStartDeltaX = 0, contourStartDeltaY = 0, deltaX = 0, deltaY = 0, l;
  
      d = d || 0;
  
      this.__evaluateStack();
  
      this.segments.forEach(function (s) {
        var isRelative = (s[0].toLowerCase() === s[0]), t;
  
        switch (s[0]) {
          case 'H':
          case 'h':
            if (isRelative) { s[1] += deltaX; }
            deltaX = s[1] - s[1].toFixed(d);
            s[1] = +s[1].toFixed(d);
            return;
  
          case 'V':
          case 'v':
            if (isRelative) { s[1] += deltaY; }
            deltaY = s[1] - s[1].toFixed(d);
            s[1] = +s[1].toFixed(d);
            return;
  
          case 'Z':
          case 'z':
            deltaX = contourStartDeltaX;
            deltaY = contourStartDeltaY;
            return;
  
          case 'M':
          case 'm':
            if (isRelative) {
              s[1] += deltaX;
              s[2] += deltaY;
            }
  
            deltaX = s[1] - s[1].toFixed(d);
            deltaY = s[2] - s[2].toFixed(d);
  
            contourStartDeltaX = deltaX;
            contourStartDeltaY = deltaY;
  
            s[1] = +s[1].toFixed(d);
            s[2] = +s[2].toFixed(d);
            return;
  
          case 'A':
          case 'a':
            // [cmd, rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]
            if (isRelative) {
              s[6] += deltaX;
              s[7] += deltaY;
            }
  
            deltaX = s[6] - s[6].toFixed(d);
            deltaY = s[7] - s[7].toFixed(d);
  
            s[1] = +s[1].toFixed(d);
            s[2] = +s[2].toFixed(d);
            s[3] = +s[3].toFixed(d + 2); // better precision for rotation
            s[6] = +s[6].toFixed(d);
            s[7] = +s[7].toFixed(d);
            return;
  
          default:
            // a c l q s t
            l = s.length;
  
            if (isRelative) {
              s[l - 2] += deltaX;
              s[l - 1] += deltaY;
            }
  
            deltaX = s[l - 2] - s[l - 2].toFixed(d);
            deltaY = s[l - 1] - s[l - 1].toFixed(d);
  
            s.forEach(function (val, i) {
              if (!i) { return; }
              s[i] = +s[i].toFixed(d);
            });
            return;
        }
      });
  
      return this;
    };
  
  
    // Apply iterator function to all segments. If function returns result,
    // current segment will be replaced to array of returned segments.
    // If empty array is returned, current regment will be deleted.
    //
    SvgPath.prototype.iterate = function (iterator, keepLazyStack) {
      var segments = this.segments,
          replacements = {},
          needReplace = false,
          lastX = 0,
          lastY = 0,
          countourStartX = 0,
          countourStartY = 0;
      var i, j, isRelative, newSegments;
  
      if (!keepLazyStack) {
        this.__evaluateStack();
      }
  
      segments.forEach(function (s, index) {
  
        var res = iterator(s, index, lastX, lastY);
  
        if (Array.isArray(res)) {
          replacements[index] = res;
          needReplace = true;
        }
  
        var isRelative = (s[0] === s[0].toLowerCase());
  
        // calculate absolute X and Y
        switch (s[0]) {
          case 'm':
          case 'M':
            lastX = s[1] + (isRelative ? lastX : 0);
            lastY = s[2] + (isRelative ? lastY : 0);
            countourStartX = lastX;
            countourStartY = lastY;
            return;
  
          case 'h':
          case 'H':
            lastX = s[1] + (isRelative ? lastX : 0);
            return;
  
          case 'v':
          case 'V':
            lastY = s[1] + (isRelative ? lastY : 0);
            return;
  
          case 'z':
          case 'Z':
            // That make sence for multiple contours
            lastX = countourStartX;
            lastY = countourStartY;
            return;
  
          default:
            lastX = s[s.length - 2] + (isRelative ? lastX : 0);
            lastY = s[s.length - 1] + (isRelative ? lastY : 0);
        }
      });
  
      // Replace segments if iterator return results
  
      if (!needReplace) { return this; }
  
      newSegments = [];
  
      for (i = 0; i < segments.length; i++) {
        if (typeof replacements[i] !== 'undefined') {
          for (j = 0; j < replacements[i].length; j++) {
            newSegments.push(replacements[i][j]);
          }
        } else {
          newSegments.push(segments[i]);
        }
      }
  
      this.segments = newSegments;
  
      return this;
    };
  
  
    // Converts segments from relative to absolute
    //
    SvgPath.prototype.abs = function () {
  
      this.iterate(function (s, index, x, y) {
        var name = s[0],
            nameUC = name.toUpperCase(),
            i;
  
        // Skip absolute commands
        if (name === nameUC) { return; }
  
        s[0] = nameUC;
  
        switch (name) {
          case 'v':
            // v has shifted coords parity
            s[1] += y;
            return;
  
          case 'a':
            // ARC is: ['A', rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]
            // touch x, y only
            s[6] += x;
            s[7] += y;
            return;
  
          default:
            for (i = 1; i < s.length; i++) {
              s[i] += i % 2 ? x : y; // odd values are X, even - Y
            }
        }
      }, true);
  
      return this;
    };
  
  
    // Converts segments from absolute to relative
    //
    SvgPath.prototype.rel = function () {
  
      this.iterate(function (s, index, x, y) {
        var name = s[0],
            nameLC = name.toLowerCase(),
            i;
  
        // Skip relative commands
        if (name === nameLC) { return; }
  
        // Don't touch the first M to avoid potential confusions.
        if (index === 0 && name === 'M') { return; }
  
        s[0] = nameLC;
  
        switch (name) {
          case 'V':
            // V has shifted coords parity
            s[1] -= y;
            return;
  
          case 'A':
            // ARC is: ['A', rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]
            // touch x, y only
            s[6] -= x;
            s[7] -= y;
            return;
  
          default:
            for (i = 1; i < s.length; i++) {
              s[i] -= i % 2 ? x : y; // odd values are X, even - Y
            }
        }
      }, true);
  
      return this;
    };
  
  
    // Converts arcs to cubic bézier curves
    //
    SvgPath.prototype.unarc = function () {
      this.iterate(function (s, index, x, y) {
        var i, new_segments, nextX, nextY, result = [], name = s[0];
  
        // Skip anything except arcs
        if (name !== 'A' && name !== 'a') { return null; }
  
        if (name === 'a') {
          // convert relative arc coordinates to absolute
          nextX = x + s[6];
          nextY = y + s[7];
        } else {
          nextX = s[6];
          nextY = s[7];
        }
  
        new_segments = a2c(x, y, nextX, nextY, s[4], s[5], s[1], s[2], s[3]);
  
        // Degenerated arcs can be ignored by renderer, but should not be dropped
        // to avoid collisions with `S A S` and so on. Replace with empty line.
        if (new_segments.length === 0) {
          return [ [ s[0] === 'a' ? 'l' : 'L', s[6], s[7] ] ];
        }
  
        new_segments.forEach(function (s) {
          result.push([ 'C', s[2], s[3], s[4], s[5], s[6], s[7] ]);
        });
  
        return result;
      });
  
      return this;
    };
  
  
    // Converts smooth curves (with missed control point) to generic curves
    //
    SvgPath.prototype.unshort = function () {
      var segments = this.segments;
      var prevControlX, prevControlY, prevSegment;
      var curControlX, curControlY;
  
      // TODO: add lazy evaluation flag when relative commands supported
  
      this.iterate(function (s, idx, x, y) {
        var name = s[0], nameUC = name.toUpperCase(), isRelative;
  
        // First command MUST be M|m, it's safe to skip.
        // Protect from access to [-1] for sure.
        if (!idx) { return; }
  
        if (nameUC === 'T') { // quadratic curve
          isRelative = (name === 't');
  
          prevSegment = segments[idx - 1];
  
          if (prevSegment[0] === 'Q') {
            prevControlX = prevSegment[1] - x;
            prevControlY = prevSegment[2] - y;
          } else if (prevSegment[0] === 'q') {
            prevControlX = prevSegment[1] - prevSegment[3];
            prevControlY = prevSegment[2] - prevSegment[4];
          } else {
            prevControlX = 0;
            prevControlY = 0;
          }
  
          curControlX = -prevControlX;
          curControlY = -prevControlY;
  
          if (!isRelative) {
            curControlX += x;
            curControlY += y;
          }
  
          segments[idx] = [
            isRelative ? 'q' : 'Q',
            curControlX, curControlY,
            s[1], s[2]
          ];
  
        } else if (nameUC === 'S') { // cubic curve
          isRelative = (name === 's');
  
          prevSegment = segments[idx - 1];
  
          if (prevSegment[0] === 'C') {
            prevControlX = prevSegment[3] - x;
            prevControlY = prevSegment[4] - y;
          } else if (prevSegment[0] === 'c') {
            prevControlX = prevSegment[3] - prevSegment[5];
            prevControlY = prevSegment[4] - prevSegment[6];
          } else {
            prevControlX = 0;
            prevControlY = 0;
          }
  
          curControlX = -prevControlX;
          curControlY = -prevControlY;
  
          if (!isRelative) {
            curControlX += x;
            curControlY += y;
          }
  
          segments[idx] = [
            isRelative ? 'c' : 'C',
            curControlX, curControlY,
            s[1], s[2], s[3], s[4]
          ];
        }
      });
  
      return this;
    };
  
  
    module.exports = SvgPath;
    });
  
    var svgpath$2 = interopDefault(svgpath$1);
  
  
    var require$$0 = Object.freeze({
      default: svgpath$2
    });
  
    var require$$0 = Object.freeze({
      default: svgpath$2
    });
  
    var index = createCommonjsModule(function (module) {
    'use strict';
  
    module.exports = interopDefault(require$$0);
    });
  
    var svgpath = interopDefault(index);
  
    function applyTransforms ( node, transforms ) {
        if ( node.attributes.transform ) {
            transforms = transforms.concat( node.attributes.transform );
            delete node.attributes.transform;
        }
  
        var transformString = transforms.join( ' ' );
  
        if ( node.name === 'path' ) {
            node.attributes.d = svgpath( node.attributes.d )
                .transform( transformString )
                .round( 10 )
                .toString();
        } else if ( transformString ) {
            node.attributes.transform = transformString;
        }
    }
  
    var ignore = [ 'defs', 'title' ];
    var noninheritable = [ 'id', 'class', 'style', 'transform' ];
  
    function walk ( node, paths, transforms, classes, attributes ) {
        if ( node.name === 'svg' ) {
            var _transforms = transforms.slice();
            node.children.forEach( function (child) {
                walk( child, paths, _transforms, assign( {}, classes ), assign( {}, attributes ) );
            });
        }
  
        else if ( node.name === 'g' ) {
            transforms = node.attributes.transform ? transforms.concat( node.attributes.transform ) : transforms;
  
            if ( node.attributes.class ) {
                node.attributes.class.split( ' ' )
                    .filter( Boolean )
                    .forEach( function (className) { return classes[ className ] = true; } );
            }
  
            node.children.forEach( function (child) {
                var _classes = assign( {}, classes );
  
                var _attributes = assign(
                    cloneExcept( attributes, noninheritable ),
                    cloneExcept( node.attributes, noninheritable )
                );
  
                walk( child, paths, transforms, _classes, _attributes );
            });
        }
  
        else if ( ~ignore.indexOf( node.name ) ) {
            applyAttributes( node, attributes );
            applyClasses( node, classes );
            applyTransforms( node, transforms );
            paths.push( node );
        }
  
        else {
            applyAttributes( node, attributes );
            applyClasses( node, classes );
  
            if ( node.name !== 'path' ) {
                node = convert( node );
            }
  
            applyTransforms( node, transforms );
            paths.push( node );
        }
    }
  
    function stringifyAttributes ( attributes ) {
        return Object.keys( attributes ).map( function (key) { return (" " + key + "=\"" + (attributes[key]) + "\""); } ).join( '' );
    }
  
    function stringify ( node, indent ) {
        if ( typeof node === 'string' ) return node;
  
        var attributes = stringifyAttributes( node.attributes );
  
        var str = indent + "<" + (node.name) + attributes;
  
        if ( node.children && node.children.length ) {
            str += '>';
            var prefix = '\n';
  
            for ( var i = 0, list = node.children; i < list.length; i += 1 ) {
                var child = list[i];
  
                if ( typeof child === 'string' ) {
                    str += child;
                    prefix = '';
                } else {
                    str += prefix + stringify( child, indent + '\t' );
                    prefix = '\n';
                }
            }
  
            if ( prefix ) prefix += indent;
  
            str += prefix + "</" + (node.name) + ">";
        } else if ( node.val ) {
            str += ">" + (node.val) + "</" + (node.name) + ">";
        } else {
            str += '/>';
        }
  
        return str;
    }
  
    var Pathologist = function Pathologist ( source ) {
        this.source = parse$1( source );
  
        this.target = {
            name: this.source.name,
            attributes: Object.assign( {}, this.source.attributes ),
            children: []
        };
  
        walk( this.source, this.target.children, [], {}, {} );
    };
  
    Pathologist.prototype.toString = function toString () {
        return stringify( this.target, '' );
    };
  
    function transform ( source ) {
        return new Pathologist( source ).toString();
    }
  
    function parse ( source ) {
        var pathologist = new Pathologist( source );
  
        return {
            paths: pathologist.target.children.filter( function (node) { return node.name === 'path'; } ).map( function (node) { return node.attributes; } ),
            toString: function toString () {
                return pathologist.toString();
            }
        };
    }
  
    exports.transform = transform;
    exports.parse = parse;
  
    Object.defineProperty(exports, '__esModule', { value: true });
  
  }));
  //# sourceMappingURL=pathologist.umd.js.map