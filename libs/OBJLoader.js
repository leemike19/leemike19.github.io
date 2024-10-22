THREE.OBJLoader = function (manager) {
    this.manager = (manager !== undefined) ? manager : THREE.DefaultLoadingManager;
};

THREE.OBJLoader.prototype = {
    constructor: THREE.OBJLoader,

    load: function (url, onLoad, onProgress, onError) {
        var scope = this;
        var loader = new THREE.FileLoader(scope.manager);
        loader.setResponseType('text');
        loader.setCrossOrigin(this.crossOrigin || 'anonymous'); // Ensure cross-origin handling is correct

        loader.load(url, function (text) {
            onLoad(scope.parse(text));
        }, onProgress, onError);
    },

    parse: function (text) {
        console.time('OBJLoader');

        let object, objects = [];
        let geometry = new THREE.BufferGeometry(), material;
        let vertices = [], normals = [], uvs = [];

        function parseVertexIndex(value) {
            var index = parseInt(value);
            return (index >= 0 ? index - 1 : index + vertices.length / 3) * 3;
        }

        function parseNormalIndex(value) {
            var index = parseInt(value);
            return (index >= 0 ? index - 1 : index + normals.length / 3) * 3;
        }

        function parseUVIndex(value) {
            var index = parseInt(value);
            return (index >= 0 ? index - 1 : index + uvs.length / 2) * 2;
        }

        function addVertex(a, b, c) {
            vertices.push(
                vertices[a], vertices[a + 1], vertices[a + 2],
                vertices[b], vertices[b + 1], vertices[b + 2],
                vertices[c], vertices[c + 1], vertices[c + 2]
            );
        }

        function addNormal(a, b, c) {
            normals.push(
                normals[a], normals[a + 1], normals[a + 2],
                normals[b], normals[b + 1], normals[b + 2],
                normals[c], normals[c + 1], normals[c + 2]
            );
        }

        function addUV(a, b, c) {
            uvs.push(
                uvs[a], uvs[a + 1],
                uvs[b], uvs[b + 1],
                uvs[c], uvs[c + 1]
            );
        }

        function addFace(a, b, c, d, ua, ub, uc, ud, na, nb, nc, nd) {
            var ia = parseVertexIndex(a);
            var ib = parseVertexIndex(b);
            var ic = parseVertexIndex(c);
            var id;

            if (d === undefined) {
                addVertex(ia, ib, ic);
            } else {
                id = parseVertexIndex(d);
                addVertex(ia, ib, id);
                addVertex(ib, ic, id);
            }

            if (ua !== undefined) {
                ia = parseUVIndex(ua);
                ib = parseUVIndex(ub);
                ic = parseUVIndex(uc);
                if (d === undefined) {
                    addUV(ia, ib, ic);
                } else {
                    id = parseUVIndex(ud);
                    addUV(ia, ib, id);
                    addUV(ib, ic, id);
                }
            }

            if (na !== undefined) {
                ia = parseNormalIndex(na);
                ib = parseNormalIndex(nb);
                ic = parseNormalIndex(nc);
                if (d === undefined) {
                    addNormal(ia, ib, ic);
                } else {
                    id = parseNormalIndex(nd);
                    addNormal(ia, ib, id);
                    addNormal(ib, ic, id);
                }
            }
        }

        // OBJ parsing
        const vertex_pattern = /v( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)/;
        const normal_pattern = /vn( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)/;
        const uv_pattern = /vt( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)/;
        const face_pattern1 = /f( +-?\d+)( +-?\d+)( +-?\d+)( +-?\d+)?/;

        const lines = text.split('\n');

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line.length === 0 || line.charAt(0) === '#') continue;

            let result;
            if ((result = vertex_pattern.exec(line)) !== null) {
                vertices.push(
                    parseFloat(result[1]),
                    parseFloat(result[2]),
                    parseFloat(result[3])
                );
            } else if ((result = normal_pattern.exec(line)) !== null) {
                normals.push(
                    parseFloat(result[1]),
                    parseFloat(result[2]),
                    parseFloat(result[3])
                );
            } else if ((result = uv_pattern.exec(line)) !== null) {
                uvs.push(
                    parseFloat(result[1]),
                    parseFloat(result[2])
                );
            } else if ((result = face_pattern1.exec(line)) !== null) {
                addFace(result[1], result[2], result[3], result[4]);
            }
        }

        const container = new THREE.Object3D();

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        if (normals.length > 0) {
            geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        }

        if (uvs.length > 0) {
            geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        }

        material = new THREE.MeshBasicMaterial(); // More compatibility with low-end devices
        const mesh = new THREE.Mesh(geometry, material);
        container.add(mesh);

        console.timeEnd('OBJLoader');
        return container;
    }
};
