// build/dev/javascript/prelude.mjs
var CustomType = class {
  withFields(fields) {
    let properties = Object.keys(this).map(
      (label2) => label2 in fields ? fields[label2] : this[label2]
    );
    return new this.constructor(...properties);
  }
};
var List = class {
  static fromArray(array3, tail) {
    let t = tail || new Empty();
    for (let i = array3.length - 1; i >= 0; --i) {
      t = new NonEmpty(array3[i], t);
    }
    return t;
  }
  [Symbol.iterator]() {
    return new ListIterator(this);
  }
  toArray() {
    return [...this];
  }
  // @internal
  atLeastLength(desired) {
    for (let _ of this) {
      if (desired <= 0)
        return true;
      desired--;
    }
    return desired <= 0;
  }
  // @internal
  hasLength(desired) {
    for (let _ of this) {
      if (desired <= 0)
        return false;
      desired--;
    }
    return desired === 0;
  }
  // @internal
  countLength() {
    let length2 = 0;
    for (let _ of this)
      length2++;
    return length2;
  }
};
function prepend(element2, tail) {
  return new NonEmpty(element2, tail);
}
function toList(elements3, tail) {
  return List.fromArray(elements3, tail);
}
var ListIterator = class {
  #current;
  constructor(current) {
    this.#current = current;
  }
  next() {
    if (this.#current instanceof Empty) {
      return { done: true };
    } else {
      let { head, tail } = this.#current;
      this.#current = tail;
      return { value: head, done: false };
    }
  }
};
var Empty = class extends List {
};
var NonEmpty = class extends List {
  constructor(head, tail) {
    super();
    this.head = head;
    this.tail = tail;
  }
};
var Result = class _Result extends CustomType {
  // @internal
  static isResult(data) {
    return data instanceof _Result;
  }
};
var Ok = class extends Result {
  constructor(value) {
    super();
    this[0] = value;
  }
  // @internal
  isOk() {
    return true;
  }
};
var Error = class extends Result {
  constructor(detail) {
    super();
    this[0] = detail;
  }
  // @internal
  isOk() {
    return false;
  }
};
function isEqual(x, y) {
  let values2 = [x, y];
  while (values2.length) {
    let a = values2.pop();
    let b = values2.pop();
    if (a === b)
      continue;
    if (!isObject(a) || !isObject(b))
      return false;
    let unequal = !structurallyCompatibleObjects(a, b) || unequalDates(a, b) || unequalBuffers(a, b) || unequalArrays(a, b) || unequalMaps(a, b) || unequalSets(a, b) || unequalRegExps(a, b);
    if (unequal)
      return false;
    const proto = Object.getPrototypeOf(a);
    if (proto !== null && typeof proto.equals === "function") {
      try {
        if (a.equals(b))
          continue;
        else
          return false;
      } catch {
      }
    }
    let [keys2, get] = getters(a);
    for (let k of keys2(a)) {
      values2.push(get(a, k), get(b, k));
    }
  }
  return true;
}
function getters(object3) {
  if (object3 instanceof Map) {
    return [(x) => x.keys(), (x, y) => x.get(y)];
  } else {
    let extra = object3 instanceof globalThis.Error ? ["message"] : [];
    return [(x) => [...extra, ...Object.keys(x)], (x, y) => x[y]];
  }
}
function unequalDates(a, b) {
  return a instanceof Date && (a > b || a < b);
}
function unequalBuffers(a, b) {
  return a.buffer instanceof ArrayBuffer && a.BYTES_PER_ELEMENT && !(a.byteLength === b.byteLength && a.every((n, i) => n === b[i]));
}
function unequalArrays(a, b) {
  return Array.isArray(a) && a.length !== b.length;
}
function unequalMaps(a, b) {
  return a instanceof Map && a.size !== b.size;
}
function unequalSets(a, b) {
  return a instanceof Set && (a.size != b.size || [...a].some((e) => !b.has(e)));
}
function unequalRegExps(a, b) {
  return a instanceof RegExp && (a.source !== b.source || a.flags !== b.flags);
}
function isObject(a) {
  return typeof a === "object" && a !== null;
}
function structurallyCompatibleObjects(a, b) {
  if (typeof a !== "object" && typeof b !== "object" && (!a || !b))
    return false;
  let nonstructural = [Promise, WeakSet, WeakMap, Function];
  if (nonstructural.some((c) => a instanceof c))
    return false;
  return a.constructor === b.constructor;
}
function makeError(variant, module, line, fn, message, extra) {
  let error = new globalThis.Error(message);
  error.gleam_error = variant;
  error.module = module;
  error.line = line;
  error.function = fn;
  error.fn = fn;
  for (let k in extra)
    error[k] = extra[k];
  return error;
}

// build/dev/javascript/gleam_stdlib/gleam/option.mjs
var None = class extends CustomType {
};

// build/dev/javascript/gleam_stdlib/gleam/dict.mjs
function insert(dict2, key, value) {
  return map_insert(key, value, dict2);
}
function reverse_and_concat(loop$remaining, loop$accumulator) {
  while (true) {
    let remaining = loop$remaining;
    let accumulator = loop$accumulator;
    if (remaining.hasLength(0)) {
      return accumulator;
    } else {
      let first2 = remaining.head;
      let rest = remaining.tail;
      loop$remaining = rest;
      loop$accumulator = prepend(first2, accumulator);
    }
  }
}
function do_keys_loop(loop$list, loop$acc) {
  while (true) {
    let list2 = loop$list;
    let acc = loop$acc;
    if (list2.hasLength(0)) {
      return reverse_and_concat(acc, toList([]));
    } else {
      let key = list2.head[0];
      let rest = list2.tail;
      loop$list = rest;
      loop$acc = prepend(key, acc);
    }
  }
}
function keys(dict2) {
  return do_keys_loop(map_to_list(dict2), toList([]));
}

// build/dev/javascript/gleam_stdlib/gleam/list.mjs
function fold(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list2 = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list2.hasLength(0)) {
      return initial;
    } else {
      let first$1 = list2.head;
      let rest$1 = list2.tail;
      loop$list = rest$1;
      loop$initial = fun(initial, first$1);
      loop$fun = fun;
    }
  }
}
function index_fold_loop(loop$over, loop$acc, loop$with, loop$index) {
  while (true) {
    let over = loop$over;
    let acc = loop$acc;
    let with$ = loop$with;
    let index3 = loop$index;
    if (over.hasLength(0)) {
      return acc;
    } else {
      let first$1 = over.head;
      let rest$1 = over.tail;
      loop$over = rest$1;
      loop$acc = with$(acc, first$1, index3);
      loop$with = with$;
      loop$index = index3 + 1;
    }
  }
}
function index_fold(list2, initial, fun) {
  return index_fold_loop(list2, initial, fun, 0);
}

// build/dev/javascript/gleam_stdlib/gleam/string.mjs
function drop_start(loop$string, loop$num_graphemes) {
  while (true) {
    let string4 = loop$string;
    let num_graphemes = loop$num_graphemes;
    let $ = num_graphemes > 0;
    if (!$) {
      return string4;
    } else {
      let $1 = pop_grapheme(string4);
      if ($1.isOk()) {
        let string$1 = $1[0][1];
        loop$string = string$1;
        loop$num_graphemes = num_graphemes - 1;
      } else {
        return string4;
      }
    }
  }
}

// build/dev/javascript/gleam_stdlib/dict.mjs
var referenceMap = /* @__PURE__ */ new WeakMap();
var tempDataView = new DataView(new ArrayBuffer(8));
var referenceUID = 0;
function hashByReference(o) {
  const known = referenceMap.get(o);
  if (known !== void 0) {
    return known;
  }
  const hash = referenceUID++;
  if (referenceUID === 2147483647) {
    referenceUID = 0;
  }
  referenceMap.set(o, hash);
  return hash;
}
function hashMerge(a, b) {
  return a ^ b + 2654435769 + (a << 6) + (a >> 2) | 0;
}
function hashString(s) {
  let hash = 0;
  const len = s.length;
  for (let i = 0; i < len; i++) {
    hash = Math.imul(31, hash) + s.charCodeAt(i) | 0;
  }
  return hash;
}
function hashNumber(n) {
  tempDataView.setFloat64(0, n);
  const i = tempDataView.getInt32(0);
  const j = tempDataView.getInt32(4);
  return Math.imul(73244475, i >> 16 ^ i) ^ j;
}
function hashBigInt(n) {
  return hashString(n.toString());
}
function hashObject(o) {
  const proto = Object.getPrototypeOf(o);
  if (proto !== null && typeof proto.hashCode === "function") {
    try {
      const code = o.hashCode(o);
      if (typeof code === "number") {
        return code;
      }
    } catch {
    }
  }
  if (o instanceof Promise || o instanceof WeakSet || o instanceof WeakMap) {
    return hashByReference(o);
  }
  if (o instanceof Date) {
    return hashNumber(o.getTime());
  }
  let h = 0;
  if (o instanceof ArrayBuffer) {
    o = new Uint8Array(o);
  }
  if (Array.isArray(o) || o instanceof Uint8Array) {
    for (let i = 0; i < o.length; i++) {
      h = Math.imul(31, h) + getHash(o[i]) | 0;
    }
  } else if (o instanceof Set) {
    o.forEach((v) => {
      h = h + getHash(v) | 0;
    });
  } else if (o instanceof Map) {
    o.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
  } else {
    const keys2 = Object.keys(o);
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      const v = o[k];
      h = h + hashMerge(getHash(v), hashString(k)) | 0;
    }
  }
  return h;
}
function getHash(u) {
  if (u === null)
    return 1108378658;
  if (u === void 0)
    return 1108378659;
  if (u === true)
    return 1108378657;
  if (u === false)
    return 1108378656;
  switch (typeof u) {
    case "number":
      return hashNumber(u);
    case "string":
      return hashString(u);
    case "bigint":
      return hashBigInt(u);
    case "object":
      return hashObject(u);
    case "symbol":
      return hashByReference(u);
    case "function":
      return hashByReference(u);
    default:
      return 0;
  }
}
var SHIFT = 5;
var BUCKET_SIZE = Math.pow(2, SHIFT);
var MASK = BUCKET_SIZE - 1;
var MAX_INDEX_NODE = BUCKET_SIZE / 2;
var MIN_ARRAY_NODE = BUCKET_SIZE / 4;
var ENTRY = 0;
var ARRAY_NODE = 1;
var INDEX_NODE = 2;
var COLLISION_NODE = 3;
var EMPTY = {
  type: INDEX_NODE,
  bitmap: 0,
  array: []
};
function mask(hash, shift) {
  return hash >>> shift & MASK;
}
function bitpos(hash, shift) {
  return 1 << mask(hash, shift);
}
function bitcount(x) {
  x -= x >> 1 & 1431655765;
  x = (x & 858993459) + (x >> 2 & 858993459);
  x = x + (x >> 4) & 252645135;
  x += x >> 8;
  x += x >> 16;
  return x & 127;
}
function index(bitmap, bit) {
  return bitcount(bitmap & bit - 1);
}
function cloneAndSet(arr, at, val) {
  const len = arr.length;
  const out = new Array(len);
  for (let i = 0; i < len; ++i) {
    out[i] = arr[i];
  }
  out[at] = val;
  return out;
}
function spliceIn(arr, at, val) {
  const len = arr.length;
  const out = new Array(len + 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  out[g++] = val;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function spliceOut(arr, at) {
  const len = arr.length;
  const out = new Array(len - 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  ++i;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function createNode(shift, key1, val1, key2hash, key2, val2) {
  const key1hash = getHash(key1);
  if (key1hash === key2hash) {
    return {
      type: COLLISION_NODE,
      hash: key1hash,
      array: [
        { type: ENTRY, k: key1, v: val1 },
        { type: ENTRY, k: key2, v: val2 }
      ]
    };
  }
  const addedLeaf = { val: false };
  return assoc(
    assocIndex(EMPTY, shift, key1hash, key1, val1, addedLeaf),
    shift,
    key2hash,
    key2,
    val2,
    addedLeaf
  );
}
function assoc(root, shift, hash, key, val, addedLeaf) {
  switch (root.type) {
    case ARRAY_NODE:
      return assocArray(root, shift, hash, key, val, addedLeaf);
    case INDEX_NODE:
      return assocIndex(root, shift, hash, key, val, addedLeaf);
    case COLLISION_NODE:
      return assocCollision(root, shift, hash, key, val, addedLeaf);
  }
}
function assocArray(root, shift, hash, key, val, addedLeaf) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
  if (node === void 0) {
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root.size + 1,
      array: cloneAndSet(root.array, idx, { type: ENTRY, k: key, v: val })
    };
  }
  if (node.type === ENTRY) {
    if (isEqual(key, node.k)) {
      if (val === node.v) {
        return root;
      }
      return {
        type: ARRAY_NODE,
        size: root.size,
        array: cloneAndSet(root.array, idx, {
          type: ENTRY,
          k: key,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root.size,
      array: cloneAndSet(
        root.array,
        idx,
        createNode(shift + SHIFT, node.k, node.v, hash, key, val)
      )
    };
  }
  const n = assoc(node, shift + SHIFT, hash, key, val, addedLeaf);
  if (n === node) {
    return root;
  }
  return {
    type: ARRAY_NODE,
    size: root.size,
    array: cloneAndSet(root.array, idx, n)
  };
}
function assocIndex(root, shift, hash, key, val, addedLeaf) {
  const bit = bitpos(hash, shift);
  const idx = index(root.bitmap, bit);
  if ((root.bitmap & bit) !== 0) {
    const node = root.array[idx];
    if (node.type !== ENTRY) {
      const n = assoc(node, shift + SHIFT, hash, key, val, addedLeaf);
      if (n === node) {
        return root;
      }
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, n)
      };
    }
    const nodeKey = node.k;
    if (isEqual(key, nodeKey)) {
      if (val === node.v) {
        return root;
      }
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, {
          type: ENTRY,
          k: key,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap,
      array: cloneAndSet(
        root.array,
        idx,
        createNode(shift + SHIFT, nodeKey, node.v, hash, key, val)
      )
    };
  } else {
    const n = root.array.length;
    if (n >= MAX_INDEX_NODE) {
      const nodes = new Array(32);
      const jdx = mask(hash, shift);
      nodes[jdx] = assocIndex(EMPTY, shift + SHIFT, hash, key, val, addedLeaf);
      let j = 0;
      let bitmap = root.bitmap;
      for (let i = 0; i < 32; i++) {
        if ((bitmap & 1) !== 0) {
          const node = root.array[j++];
          nodes[i] = node;
        }
        bitmap = bitmap >>> 1;
      }
      return {
        type: ARRAY_NODE,
        size: n + 1,
        array: nodes
      };
    } else {
      const newArray = spliceIn(root.array, idx, {
        type: ENTRY,
        k: key,
        v: val
      });
      addedLeaf.val = true;
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap | bit,
        array: newArray
      };
    }
  }
}
function assocCollision(root, shift, hash, key, val, addedLeaf) {
  if (hash === root.hash) {
    const idx = collisionIndexOf(root, key);
    if (idx !== -1) {
      const entry = root.array[idx];
      if (entry.v === val) {
        return root;
      }
      return {
        type: COLLISION_NODE,
        hash,
        array: cloneAndSet(root.array, idx, { type: ENTRY, k: key, v: val })
      };
    }
    const size = root.array.length;
    addedLeaf.val = true;
    return {
      type: COLLISION_NODE,
      hash,
      array: cloneAndSet(root.array, size, { type: ENTRY, k: key, v: val })
    };
  }
  return assoc(
    {
      type: INDEX_NODE,
      bitmap: bitpos(root.hash, shift),
      array: [root]
    },
    shift,
    hash,
    key,
    val,
    addedLeaf
  );
}
function collisionIndexOf(root, key) {
  const size = root.array.length;
  for (let i = 0; i < size; i++) {
    if (isEqual(key, root.array[i].k)) {
      return i;
    }
  }
  return -1;
}
function find(root, shift, hash, key) {
  switch (root.type) {
    case ARRAY_NODE:
      return findArray(root, shift, hash, key);
    case INDEX_NODE:
      return findIndex(root, shift, hash, key);
    case COLLISION_NODE:
      return findCollision(root, key);
  }
}
function findArray(root, shift, hash, key) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
  if (node === void 0) {
    return void 0;
  }
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key);
  }
  if (isEqual(key, node.k)) {
    return node;
  }
  return void 0;
}
function findIndex(root, shift, hash, key) {
  const bit = bitpos(hash, shift);
  if ((root.bitmap & bit) === 0) {
    return void 0;
  }
  const idx = index(root.bitmap, bit);
  const node = root.array[idx];
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key);
  }
  if (isEqual(key, node.k)) {
    return node;
  }
  return void 0;
}
function findCollision(root, key) {
  const idx = collisionIndexOf(root, key);
  if (idx < 0) {
    return void 0;
  }
  return root.array[idx];
}
function without(root, shift, hash, key) {
  switch (root.type) {
    case ARRAY_NODE:
      return withoutArray(root, shift, hash, key);
    case INDEX_NODE:
      return withoutIndex(root, shift, hash, key);
    case COLLISION_NODE:
      return withoutCollision(root, key);
  }
}
function withoutArray(root, shift, hash, key) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
  if (node === void 0) {
    return root;
  }
  let n = void 0;
  if (node.type === ENTRY) {
    if (!isEqual(node.k, key)) {
      return root;
    }
  } else {
    n = without(node, shift + SHIFT, hash, key);
    if (n === node) {
      return root;
    }
  }
  if (n === void 0) {
    if (root.size <= MIN_ARRAY_NODE) {
      const arr = root.array;
      const out = new Array(root.size - 1);
      let i = 0;
      let j = 0;
      let bitmap = 0;
      while (i < idx) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      ++i;
      while (i < arr.length) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      return {
        type: INDEX_NODE,
        bitmap,
        array: out
      };
    }
    return {
      type: ARRAY_NODE,
      size: root.size - 1,
      array: cloneAndSet(root.array, idx, n)
    };
  }
  return {
    type: ARRAY_NODE,
    size: root.size,
    array: cloneAndSet(root.array, idx, n)
  };
}
function withoutIndex(root, shift, hash, key) {
  const bit = bitpos(hash, shift);
  if ((root.bitmap & bit) === 0) {
    return root;
  }
  const idx = index(root.bitmap, bit);
  const node = root.array[idx];
  if (node.type !== ENTRY) {
    const n = without(node, shift + SHIFT, hash, key);
    if (n === node) {
      return root;
    }
    if (n !== void 0) {
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, n)
      };
    }
    if (root.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap ^ bit,
      array: spliceOut(root.array, idx)
    };
  }
  if (isEqual(key, node.k)) {
    if (root.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap ^ bit,
      array: spliceOut(root.array, idx)
    };
  }
  return root;
}
function withoutCollision(root, key) {
  const idx = collisionIndexOf(root, key);
  if (idx < 0) {
    return root;
  }
  if (root.array.length === 1) {
    return void 0;
  }
  return {
    type: COLLISION_NODE,
    hash: root.hash,
    array: spliceOut(root.array, idx)
  };
}
function forEach(root, fn) {
  if (root === void 0) {
    return;
  }
  const items = root.array;
  const size = items.length;
  for (let i = 0; i < size; i++) {
    const item = items[i];
    if (item === void 0) {
      continue;
    }
    if (item.type === ENTRY) {
      fn(item.v, item.k);
      continue;
    }
    forEach(item, fn);
  }
}
var Dict = class _Dict {
  /**
   * @template V
   * @param {Record<string,V>} o
   * @returns {Dict<string,V>}
   */
  static fromObject(o) {
    const keys2 = Object.keys(o);
    let m = _Dict.new();
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      m = m.set(k, o[k]);
    }
    return m;
  }
  /**
   * @template K,V
   * @param {Map<K,V>} o
   * @returns {Dict<K,V>}
   */
  static fromMap(o) {
    let m = _Dict.new();
    o.forEach((v, k) => {
      m = m.set(k, v);
    });
    return m;
  }
  static new() {
    return new _Dict(void 0, 0);
  }
  /**
   * @param {undefined | Node<K,V>} root
   * @param {number} size
   */
  constructor(root, size) {
    this.root = root;
    this.size = size;
  }
  /**
   * @template NotFound
   * @param {K} key
   * @param {NotFound} notFound
   * @returns {NotFound | V}
   */
  get(key, notFound) {
    if (this.root === void 0) {
      return notFound;
    }
    const found = find(this.root, 0, getHash(key), key);
    if (found === void 0) {
      return notFound;
    }
    return found.v;
  }
  /**
   * @param {K} key
   * @param {V} val
   * @returns {Dict<K,V>}
   */
  set(key, val) {
    const addedLeaf = { val: false };
    const root = this.root === void 0 ? EMPTY : this.root;
    const newRoot = assoc(root, 0, getHash(key), key, val, addedLeaf);
    if (newRoot === this.root) {
      return this;
    }
    return new _Dict(newRoot, addedLeaf.val ? this.size + 1 : this.size);
  }
  /**
   * @param {K} key
   * @returns {Dict<K,V>}
   */
  delete(key) {
    if (this.root === void 0) {
      return this;
    }
    const newRoot = without(this.root, 0, getHash(key), key);
    if (newRoot === this.root) {
      return this;
    }
    if (newRoot === void 0) {
      return _Dict.new();
    }
    return new _Dict(newRoot, this.size - 1);
  }
  /**
   * @param {K} key
   * @returns {boolean}
   */
  has(key) {
    if (this.root === void 0) {
      return false;
    }
    return find(this.root, 0, getHash(key), key) !== void 0;
  }
  /**
   * @returns {[K,V][]}
   */
  entries() {
    if (this.root === void 0) {
      return [];
    }
    const result = [];
    this.forEach((v, k) => result.push([k, v]));
    return result;
  }
  /**
   *
   * @param {(val:V,key:K)=>void} fn
   */
  forEach(fn) {
    forEach(this.root, fn);
  }
  hashCode() {
    let h = 0;
    this.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
    return h;
  }
  /**
   * @param {unknown} o
   * @returns {boolean}
   */
  equals(o) {
    if (!(o instanceof _Dict) || this.size !== o.size) {
      return false;
    }
    try {
      this.forEach((v, k) => {
        if (!isEqual(o.get(k, !v), v)) {
          throw unequalDictSymbol;
        }
      });
      return true;
    } catch (e) {
      if (e === unequalDictSymbol) {
        return false;
      }
      throw e;
    }
  }
};
var unequalDictSymbol = Symbol();

// build/dev/javascript/gleam_stdlib/gleam_stdlib.mjs
var Nil = void 0;
function identity(x) {
  return x;
}
function to_string(term) {
  return term.toString();
}
var segmenter = void 0;
function graphemes_iterator(string4) {
  if (globalThis.Intl && Intl.Segmenter) {
    segmenter ||= new Intl.Segmenter();
    return segmenter.segment(string4)[Symbol.iterator]();
  }
}
function pop_grapheme(string4) {
  let first2;
  const iterator = graphemes_iterator(string4);
  if (iterator) {
    first2 = iterator.next().value?.segment;
  } else {
    first2 = string4.match(/./su)?.[0];
  }
  if (first2) {
    return new Ok([first2, string4.slice(first2.length)]);
  } else {
    return new Error(Nil);
  }
}
var unicode_whitespaces = [
  " ",
  // Space
  "	",
  // Horizontal tab
  "\n",
  // Line feed
  "\v",
  // Vertical tab
  "\f",
  // Form feed
  "\r",
  // Carriage return
  "\x85",
  // Next line
  "\u2028",
  // Line separator
  "\u2029"
  // Paragraph separator
].join("");
var trim_start_regex = new RegExp(`^[${unicode_whitespaces}]*`);
var trim_end_regex = new RegExp(`[${unicode_whitespaces}]*$`);
function new_map() {
  return Dict.new();
}
function map_to_list(map4) {
  return List.fromArray(map4.entries());
}
function map_insert(key, value, map4) {
  return map4.set(key, value);
}

// build/dev/javascript/gleam_stdlib/gleam/bool.mjs
function guard(requirement, consequence, alternative) {
  if (requirement) {
    return consequence;
  } else {
    return alternative();
  }
}

// build/dev/javascript/lustre/lustre/effect.mjs
var Effect = class extends CustomType {
  constructor(all) {
    super();
    this.all = all;
  }
};
function none() {
  return new Effect(toList([]));
}

// build/dev/javascript/lustre/lustre/internals/vdom.mjs
var Text = class extends CustomType {
  constructor(content) {
    super();
    this.content = content;
  }
};
var Element = class extends CustomType {
  constructor(key, namespace, tag2, attrs, children2, self_closing, void$) {
    super();
    this.key = key;
    this.namespace = namespace;
    this.tag = tag2;
    this.attrs = attrs;
    this.children = children2;
    this.self_closing = self_closing;
    this.void = void$;
  }
};
var Map2 = class extends CustomType {
  constructor(subtree) {
    super();
    this.subtree = subtree;
  }
};
var Attribute = class extends CustomType {
  constructor(x0, x1, as_property) {
    super();
    this[0] = x0;
    this[1] = x1;
    this.as_property = as_property;
  }
};
var Event = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
function attribute_to_event_handler(attribute2) {
  if (attribute2 instanceof Attribute) {
    return new Error(void 0);
  } else {
    let name = attribute2[0];
    let handler = attribute2[1];
    let name$1 = drop_start(name, 2);
    return new Ok([name$1, handler]);
  }
}
function do_element_list_handlers(elements3, handlers2, key) {
  return index_fold(
    elements3,
    handlers2,
    (handlers3, element2, index3) => {
      let key$1 = key + "-" + to_string(index3);
      return do_handlers(element2, handlers3, key$1);
    }
  );
}
function do_handlers(loop$element, loop$handlers, loop$key) {
  while (true) {
    let element2 = loop$element;
    let handlers2 = loop$handlers;
    let key = loop$key;
    if (element2 instanceof Text) {
      return handlers2;
    } else if (element2 instanceof Map2) {
      let subtree = element2.subtree;
      loop$element = subtree();
      loop$handlers = handlers2;
      loop$key = key;
    } else {
      let attrs = element2.attrs;
      let children2 = element2.children;
      let handlers$1 = fold(
        attrs,
        handlers2,
        (handlers3, attr) => {
          let $ = attribute_to_event_handler(attr);
          if ($.isOk()) {
            let name = $[0][0];
            let handler = $[0][1];
            return insert(handlers3, key + "-" + name, handler);
          } else {
            return handlers3;
          }
        }
      );
      return do_element_list_handlers(children2, handlers$1, key);
    }
  }
}
function handlers(element2) {
  return do_handlers(element2, new_map(), "0");
}

// build/dev/javascript/lustre/lustre/attribute.mjs
function attribute(name, value) {
  return new Attribute(name, identity(value), false);
}
function on(name, handler) {
  return new Event("on" + name, handler);
}
function style(properties) {
  return attribute(
    "style",
    fold(
      properties,
      "",
      (styles, _use1) => {
        let name$1 = _use1[0];
        let value$1 = _use1[1];
        return styles + name$1 + ":" + value$1 + ";";
      }
    )
  );
}
function class$(name) {
  return attribute("class", name);
}
function type_(name) {
  return attribute("type", name);
}

// build/dev/javascript/lustre/lustre/element.mjs
function element(tag2, attrs, children2) {
  if (tag2 === "area") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "base") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "br") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "col") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "embed") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "hr") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "img") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "input") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "link") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "meta") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "param") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "source") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "track") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "wbr") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else {
    return new Element("", "", tag2, attrs, children2, false, false);
  }
}
function text(content) {
  return new Text(content);
}

// build/dev/javascript/gleam_stdlib/gleam/set.mjs
var Set2 = class extends CustomType {
  constructor(dict2) {
    super();
    this.dict = dict2;
  }
};
function new$2() {
  return new Set2(new_map());
}

// build/dev/javascript/lustre/lustre/internals/patch.mjs
var Diff = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Emit = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Init = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
function is_empty_element_diff(diff2) {
  return isEqual(diff2.created, new_map()) && isEqual(
    diff2.removed,
    new$2()
  ) && isEqual(diff2.updated, new_map());
}

// build/dev/javascript/lustre/lustre/internals/runtime.mjs
var Attrs = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Batch = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Debug = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Dispatch = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Emit2 = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Event2 = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Shutdown = class extends CustomType {
};
var Subscribe = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Unsubscribe = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var ForceModel = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};

// build/dev/javascript/lustre/vdom.ffi.mjs
if (globalThis.customElements && !globalThis.customElements.get("lustre-fragment")) {
  globalThis.customElements.define(
    "lustre-fragment",
    class LustreFragment extends HTMLElement {
      constructor() {
        super();
      }
    }
  );
}
function morph(prev, next, dispatch) {
  let out;
  let stack2 = [{ prev, next, parent: prev.parentNode }];
  while (stack2.length) {
    let { prev: prev2, next: next2, parent } = stack2.pop();
    while (next2.subtree !== void 0)
      next2 = next2.subtree();
    if (next2.content !== void 0) {
      if (!prev2) {
        const created = document.createTextNode(next2.content);
        parent.appendChild(created);
        out ??= created;
      } else if (prev2.nodeType === Node.TEXT_NODE) {
        if (prev2.textContent !== next2.content)
          prev2.textContent = next2.content;
        out ??= prev2;
      } else {
        const created = document.createTextNode(next2.content);
        parent.replaceChild(created, prev2);
        out ??= created;
      }
    } else if (next2.tag !== void 0) {
      const created = createElementNode({
        prev: prev2,
        next: next2,
        dispatch,
        stack: stack2
      });
      if (!prev2) {
        parent.appendChild(created);
      } else if (prev2 !== created) {
        parent.replaceChild(created, prev2);
      }
      out ??= created;
    }
  }
  return out;
}
function createElementNode({ prev, next, dispatch, stack: stack2 }) {
  const namespace = next.namespace || "http://www.w3.org/1999/xhtml";
  const canMorph = prev && prev.nodeType === Node.ELEMENT_NODE && prev.localName === next.tag && prev.namespaceURI === (next.namespace || "http://www.w3.org/1999/xhtml");
  const el = canMorph ? prev : namespace ? document.createElementNS(namespace, next.tag) : document.createElement(next.tag);
  let handlersForEl;
  if (!registeredHandlers.has(el)) {
    const emptyHandlers = /* @__PURE__ */ new Map();
    registeredHandlers.set(el, emptyHandlers);
    handlersForEl = emptyHandlers;
  } else {
    handlersForEl = registeredHandlers.get(el);
  }
  const prevHandlers = canMorph ? new Set(handlersForEl.keys()) : null;
  const prevAttributes = canMorph ? new Set(Array.from(prev.attributes, (a) => a.name)) : null;
  let className = null;
  let style3 = null;
  let innerHTML = null;
  if (canMorph && next.tag === "textarea") {
    const innertText = next.children[Symbol.iterator]().next().value?.content;
    if (innertText !== void 0)
      el.value = innertText;
  }
  const delegated = [];
  for (const attr of next.attrs) {
    const name = attr[0];
    const value = attr[1];
    if (attr.as_property) {
      if (el[name] !== value)
        el[name] = value;
      if (canMorph)
        prevAttributes.delete(name);
    } else if (name.startsWith("on")) {
      const eventName = name.slice(2);
      const callback = dispatch(value, eventName === "input");
      if (!handlersForEl.has(eventName)) {
        el.addEventListener(eventName, lustreGenericEventHandler);
      }
      handlersForEl.set(eventName, callback);
      if (canMorph)
        prevHandlers.delete(eventName);
    } else if (name.startsWith("data-lustre-on-")) {
      const eventName = name.slice(15);
      const callback = dispatch(lustreServerEventHandler);
      if (!handlersForEl.has(eventName)) {
        el.addEventListener(eventName, lustreGenericEventHandler);
      }
      handlersForEl.set(eventName, callback);
      el.setAttribute(name, value);
      if (canMorph) {
        prevHandlers.delete(eventName);
        prevAttributes.delete(name);
      }
    } else if (name.startsWith("delegate:data-") || name.startsWith("delegate:aria-")) {
      el.setAttribute(name, value);
      delegated.push([name.slice(10), value]);
    } else if (name === "class") {
      className = className === null ? value : className + " " + value;
    } else if (name === "style") {
      style3 = style3 === null ? value : style3 + value;
    } else if (name === "dangerous-unescaped-html") {
      innerHTML = value;
    } else {
      if (el.getAttribute(name) !== value)
        el.setAttribute(name, value);
      if (name === "value" || name === "selected")
        el[name] = value;
      if (canMorph)
        prevAttributes.delete(name);
    }
  }
  if (className !== null) {
    el.setAttribute("class", className);
    if (canMorph)
      prevAttributes.delete("class");
  }
  if (style3 !== null) {
    el.setAttribute("style", style3);
    if (canMorph)
      prevAttributes.delete("style");
  }
  if (canMorph) {
    for (const attr of prevAttributes) {
      el.removeAttribute(attr);
    }
    for (const eventName of prevHandlers) {
      handlersForEl.delete(eventName);
      el.removeEventListener(eventName, lustreGenericEventHandler);
    }
  }
  if (next.tag === "slot") {
    window.queueMicrotask(() => {
      for (const child of el.assignedElements()) {
        for (const [name, value] of delegated) {
          if (!child.hasAttribute(name)) {
            child.setAttribute(name, value);
          }
        }
      }
    });
  }
  if (next.key !== void 0 && next.key !== "") {
    el.setAttribute("data-lustre-key", next.key);
  } else if (innerHTML !== null) {
    el.innerHTML = innerHTML;
    return el;
  }
  let prevChild = el.firstChild;
  let seenKeys = null;
  let keyedChildren = null;
  let incomingKeyedChildren = null;
  let firstChild = children(next).next().value;
  if (canMorph && firstChild !== void 0 && // Explicit checks are more verbose but truthy checks force a bunch of comparisons
  // we don't care about: it's never gonna be a number etc.
  firstChild.key !== void 0 && firstChild.key !== "") {
    seenKeys = /* @__PURE__ */ new Set();
    keyedChildren = getKeyedChildren(prev);
    incomingKeyedChildren = getKeyedChildren(next);
    for (const child of children(next)) {
      prevChild = diffKeyedChild(
        prevChild,
        child,
        el,
        stack2,
        incomingKeyedChildren,
        keyedChildren,
        seenKeys
      );
    }
  } else {
    for (const child of children(next)) {
      stack2.unshift({ prev: prevChild, next: child, parent: el });
      prevChild = prevChild?.nextSibling;
    }
  }
  while (prevChild) {
    const next2 = prevChild.nextSibling;
    el.removeChild(prevChild);
    prevChild = next2;
  }
  return el;
}
var registeredHandlers = /* @__PURE__ */ new WeakMap();
function lustreGenericEventHandler(event2) {
  const target = event2.currentTarget;
  if (!registeredHandlers.has(target)) {
    target.removeEventListener(event2.type, lustreGenericEventHandler);
    return;
  }
  const handlersForEventTarget = registeredHandlers.get(target);
  if (!handlersForEventTarget.has(event2.type)) {
    target.removeEventListener(event2.type, lustreGenericEventHandler);
    return;
  }
  handlersForEventTarget.get(event2.type)(event2);
}
function lustreServerEventHandler(event2) {
  const el = event2.currentTarget;
  const tag2 = el.getAttribute(`data-lustre-on-${event2.type}`);
  const data = JSON.parse(el.getAttribute("data-lustre-data") || "{}");
  const include = JSON.parse(el.getAttribute("data-lustre-include") || "[]");
  switch (event2.type) {
    case "input":
    case "change":
      include.push("target.value");
      break;
  }
  return {
    tag: tag2,
    data: include.reduce(
      (data2, property) => {
        const path = property.split(".");
        for (let i = 0, o = data2, e = event2; i < path.length; i++) {
          if (i === path.length - 1) {
            o[path[i]] = e[path[i]];
          } else {
            o[path[i]] ??= {};
            e = e[path[i]];
            o = o[path[i]];
          }
        }
        return data2;
      },
      { data }
    )
  };
}
function getKeyedChildren(el) {
  const keyedChildren = /* @__PURE__ */ new Map();
  if (el) {
    for (const child of children(el)) {
      const key = child?.key || child?.getAttribute?.("data-lustre-key");
      if (key)
        keyedChildren.set(key, child);
    }
  }
  return keyedChildren;
}
function diffKeyedChild(prevChild, child, el, stack2, incomingKeyedChildren, keyedChildren, seenKeys) {
  while (prevChild && !incomingKeyedChildren.has(prevChild.getAttribute("data-lustre-key"))) {
    const nextChild = prevChild.nextSibling;
    el.removeChild(prevChild);
    prevChild = nextChild;
  }
  if (keyedChildren.size === 0) {
    stack2.unshift({ prev: prevChild, next: child, parent: el });
    prevChild = prevChild?.nextSibling;
    return prevChild;
  }
  if (seenKeys.has(child.key)) {
    console.warn(`Duplicate key found in Lustre vnode: ${child.key}`);
    stack2.unshift({ prev: null, next: child, parent: el });
    return prevChild;
  }
  seenKeys.add(child.key);
  const keyedChild = keyedChildren.get(child.key);
  if (!keyedChild && !prevChild) {
    stack2.unshift({ prev: null, next: child, parent: el });
    return prevChild;
  }
  if (!keyedChild && prevChild !== null) {
    const placeholder = document.createTextNode("");
    el.insertBefore(placeholder, prevChild);
    stack2.unshift({ prev: placeholder, next: child, parent: el });
    return prevChild;
  }
  if (!keyedChild || keyedChild === prevChild) {
    stack2.unshift({ prev: prevChild, next: child, parent: el });
    prevChild = prevChild?.nextSibling;
    return prevChild;
  }
  el.insertBefore(keyedChild, prevChild);
  stack2.unshift({ prev: keyedChild, next: child, parent: el });
  return prevChild;
}
function* children(element2) {
  for (const child of element2.children) {
    yield* forceChild(child);
  }
}
function* forceChild(element2) {
  if (element2.subtree !== void 0) {
    yield* forceChild(element2.subtree());
  } else {
    yield element2;
  }
}

// build/dev/javascript/lustre/lustre.ffi.mjs
var LustreClientApplication = class _LustreClientApplication {
  /**
   * @template Flags
   *
   * @param {object} app
   * @param {(flags: Flags) => [Model, Lustre.Effect<Msg>]} app.init
   * @param {(msg: Msg, model: Model) => [Model, Lustre.Effect<Msg>]} app.update
   * @param {(model: Model) => Lustre.Element<Msg>} app.view
   * @param {string | HTMLElement} selector
   * @param {Flags} flags
   *
   * @returns {Gleam.Ok<(action: Lustre.Action<Lustre.Client, Msg>>) => void>}
   */
  static start({ init: init3, update: update2, view: view2 }, selector, flags) {
    if (!is_browser())
      return new Error(new NotABrowser());
    const root = selector instanceof HTMLElement ? selector : document.querySelector(selector);
    if (!root)
      return new Error(new ElementNotFound(selector));
    const app = new _LustreClientApplication(root, init3(flags), update2, view2);
    return new Ok((action) => app.send(action));
  }
  /**
   * @param {Element} root
   * @param {[Model, Lustre.Effect<Msg>]} init
   * @param {(model: Model, msg: Msg) => [Model, Lustre.Effect<Msg>]} update
   * @param {(model: Model) => Lustre.Element<Msg>} view
   *
   * @returns {LustreClientApplication}
   */
  constructor(root, [init3, effects], update2, view2) {
    this.root = root;
    this.#model = init3;
    this.#update = update2;
    this.#view = view2;
    this.#tickScheduled = window.setTimeout(
      () => this.#tick(effects.all.toArray(), true),
      0
    );
  }
  /** @type {Element} */
  root;
  /**
   * @param {Lustre.Action<Lustre.Client, Msg>} action
   *
   * @returns {void}
   */
  send(action) {
    if (action instanceof Debug) {
      if (action[0] instanceof ForceModel) {
        this.#tickScheduled = window.clearTimeout(this.#tickScheduled);
        this.#queue = [];
        this.#model = action[0][0];
        const vdom = this.#view(this.#model);
        const dispatch = (handler, immediate = false) => (event2) => {
          const result = handler(event2);
          if (result instanceof Ok) {
            this.send(new Dispatch(result[0], immediate));
          }
        };
        const prev = this.root.firstChild ?? this.root.appendChild(document.createTextNode(""));
        morph(prev, vdom, dispatch);
      }
    } else if (action instanceof Dispatch) {
      const msg = action[0];
      const immediate = action[1] ?? false;
      this.#queue.push(msg);
      if (immediate) {
        this.#tickScheduled = window.clearTimeout(this.#tickScheduled);
        this.#tick();
      } else if (!this.#tickScheduled) {
        this.#tickScheduled = window.setTimeout(() => this.#tick());
      }
    } else if (action instanceof Emit2) {
      const event2 = action[0];
      const data = action[1];
      this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
    } else if (action instanceof Shutdown) {
      this.#tickScheduled = window.clearTimeout(this.#tickScheduled);
      this.#model = null;
      this.#update = null;
      this.#view = null;
      this.#queue = null;
      while (this.root.firstChild) {
        this.root.firstChild.remove();
      }
    }
  }
  /** @type {Model} */
  #model;
  /** @type {(model: Model, msg: Msg) => [Model, Lustre.Effect<Msg>]} */
  #update;
  /** @type {(model: Model) => Lustre.Element<Msg>} */
  #view;
  /** @type {Array<Msg>} */
  #queue = [];
  /** @type {number | undefined} */
  #tickScheduled;
  /**
   * @param {Lustre.Effect<Msg>[]} effects
   */
  #tick(effects = []) {
    this.#tickScheduled = void 0;
    this.#flush(effects);
    const vdom = this.#view(this.#model);
    const dispatch = (handler, immediate = false) => (event2) => {
      const result = handler(event2);
      if (result instanceof Ok) {
        this.send(new Dispatch(result[0], immediate));
      }
    };
    const prev = this.root.firstChild ?? this.root.appendChild(document.createTextNode(""));
    morph(prev, vdom, dispatch);
  }
  #flush(effects = []) {
    while (this.#queue.length > 0) {
      const msg = this.#queue.shift();
      const [next, effect] = this.#update(this.#model, msg);
      effects = effects.concat(effect.all.toArray());
      this.#model = next;
    }
    while (effects.length > 0) {
      const effect = effects.shift();
      const dispatch = (msg) => this.send(new Dispatch(msg));
      const emit2 = (event2, data) => this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
      const select = () => {
      };
      const root = this.root;
      effect({ dispatch, emit: emit2, select, root });
    }
    if (this.#queue.length > 0) {
      this.#flush(effects);
    }
  }
};
var start = LustreClientApplication.start;
var LustreServerApplication = class _LustreServerApplication {
  static start({ init: init3, update: update2, view: view2, on_attribute_change }, flags) {
    const app = new _LustreServerApplication(
      init3(flags),
      update2,
      view2,
      on_attribute_change
    );
    return new Ok((action) => app.send(action));
  }
  constructor([model, effects], update2, view2, on_attribute_change) {
    this.#model = model;
    this.#update = update2;
    this.#view = view2;
    this.#html = view2(model);
    this.#onAttributeChange = on_attribute_change;
    this.#renderers = /* @__PURE__ */ new Map();
    this.#handlers = handlers(this.#html);
    this.#tick(effects.all.toArray());
  }
  send(action) {
    if (action instanceof Attrs) {
      for (const attr of action[0]) {
        const decoder = this.#onAttributeChange.get(attr[0]);
        if (!decoder)
          continue;
        const msg = decoder(attr[1]);
        if (msg instanceof Error)
          continue;
        this.#queue.push(msg);
      }
      this.#tick();
    } else if (action instanceof Batch) {
      this.#queue = this.#queue.concat(action[0].toArray());
      this.#tick(action[1].all.toArray());
    } else if (action instanceof Debug) {
    } else if (action instanceof Dispatch) {
      this.#queue.push(action[0]);
      this.#tick();
    } else if (action instanceof Emit2) {
      const event2 = new Emit(action[0], action[1]);
      for (const [_, renderer] of this.#renderers) {
        renderer(event2);
      }
    } else if (action instanceof Event2) {
      const handler = this.#handlers.get(action[0]);
      if (!handler)
        return;
      const msg = handler(action[1]);
      if (msg instanceof Error)
        return;
      this.#queue.push(msg[0]);
      this.#tick();
    } else if (action instanceof Subscribe) {
      const attrs = keys(this.#onAttributeChange);
      const patch = new Init(attrs, this.#html);
      this.#renderers = this.#renderers.set(action[0], action[1]);
      action[1](patch);
    } else if (action instanceof Unsubscribe) {
      this.#renderers = this.#renderers.delete(action[0]);
    }
  }
  #model;
  #update;
  #queue;
  #view;
  #html;
  #renderers;
  #handlers;
  #onAttributeChange;
  #tick(effects = []) {
    this.#flush(effects);
    const vdom = this.#view(this.#model);
    const diff2 = elements(this.#html, vdom);
    if (!is_empty_element_diff(diff2)) {
      const patch = new Diff(diff2);
      for (const [_, renderer] of this.#renderers) {
        renderer(patch);
      }
    }
    this.#html = vdom;
    this.#handlers = diff2.handlers;
  }
  #flush(effects = []) {
    while (this.#queue.length > 0) {
      const msg = this.#queue.shift();
      const [next, effect] = this.#update(this.#model, msg);
      effects = effects.concat(effect.all.toArray());
      this.#model = next;
    }
    while (effects.length > 0) {
      const effect = effects.shift();
      const dispatch = (msg) => this.send(new Dispatch(msg));
      const emit2 = (event2, data) => this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
      const select = () => {
      };
      const root = null;
      effect({ dispatch, emit: emit2, select, root });
    }
    if (this.#queue.length > 0) {
      this.#flush(effects);
    }
  }
};
var start_server_application = LustreServerApplication.start;
var is_browser = () => globalThis.window && window.document;

// build/dev/javascript/lustre/lustre.mjs
var App = class extends CustomType {
  constructor(init3, update2, view2, on_attribute_change) {
    super();
    this.init = init3;
    this.update = update2;
    this.view = view2;
    this.on_attribute_change = on_attribute_change;
  }
};
var ElementNotFound = class extends CustomType {
  constructor(selector) {
    super();
    this.selector = selector;
  }
};
var NotABrowser = class extends CustomType {
};
function application(init3, update2, view2) {
  return new App(init3, update2, view2, new None());
}
function simple(init3, update2, view2) {
  let init$1 = (flags) => {
    return [init3(flags), none()];
  };
  let update$1 = (model, msg) => {
    return [update2(model, msg), none()];
  };
  return application(init$1, update$1, view2);
}
function start2(app, selector, flags) {
  return guard(
    !is_browser(),
    new Error(new NotABrowser()),
    () => {
      return start(app, selector, flags);
    }
  );
}

// build/dev/javascript/lustre/lustre/element/html.mjs
function text2(content) {
  return text(content);
}
function style2(attrs, css) {
  return element("style", attrs, toList([text2(css)]));
}
function div(attrs, children2) {
  return element("div", attrs, children2);
}
function p(attrs, children2) {
  return element("p", attrs, children2);
}
function button(attrs, children2) {
  return element("button", attrs, children2);
}

// build/dev/javascript/lustre/lustre/event.mjs
function on2(name, handler) {
  return on(name, handler);
}
function on_click(msg) {
  return on2("click", (_) => {
    return new Ok(msg);
  });
}

// build/dev/javascript/lustre_ui/lustre/ui/button.mjs
function button2(attributes, children2) {
  return button(
    prepend(
      class$("lustre-ui-button"),
      prepend(type_("button"), attributes)
    ),
    children2
  );
}
function solid() {
  return class$("solid");
}
function primary() {
  return attribute("data-variant", "primary");
}

// build/dev/javascript/lustre_ui/lustre/ui/centre.mjs
function of(element2, attributes, children2) {
  return element2(
    prepend(class$("lustre-ui-centre"), attributes),
    toList([children2])
  );
}
function centre(attributes, children2) {
  return of(div, attributes, children2);
}

// build/dev/javascript/lustre_ui/lustre/ui/sequence.mjs
function of3(element2, attributes, children2) {
  return element2(
    prepend(class$("lustre-ui-sequence"), attributes),
    children2
  );
}
function sequence(attributes, children2) {
  return of3(div, attributes, children2);
}
function breakpoint(break$) {
  return style(toList([["--break", break$]]));
}

// build/dev/javascript/lustre_ui/lustre/ui.mjs
var button3 = button2;
var centre2 = centre;
var sequence2 = sequence;

// build/dev/javascript/lustre_ui/lustre/ui/styles.mjs
var element_css = '\n*,:after,:before{border:0 solid;box-sizing:border-box}html{-webkit-text-size-adjust:100%;font-feature-settings:normal;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;font-variation-settings:normal;line-height:1.5;-moz-tab-size:4;-o-tab-size:4;tab-size:4}body{line-height:inherit;margin:0}hr{border-top-width:1px;color:inherit;height:0}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{border-collapse:collapse;border-color:inherit;text-indent:0}button,input,optgroup,select,textarea{font-feature-settings:inherit;color:inherit;font-family:inherit;font-size:100%;font-variation-settings:inherit;font-weight:inherit;line-height:inherit;margin:0;padding:0}button,select{text-transform:none}[type=button],[type=reset],[type=submit],button{-webkit-appearance:button;background-color:transparent;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dd,dl,figure,h1,h2,h3,h4,h5,h6,hr,p,pre{margin:0}fieldset{margin:0}fieldset,legend{padding:0}menu,ol,ul{list-style:none;margin:0;padding:0}dialog{padding:0}textarea{resize:vertical}input::-moz-placeholder,textarea::-moz-placeholder{color:#9ca3af;opacity:1}input::placeholder,textarea::placeholder{color:#9ca3af;opacity:1}[role=button],button{cursor:pointer}:disabled{cursor:default}audio,canvas,embed,iframe,img,object,svg,video{display:block;vertical-align:middle}img,video{height:auto;max-width:100%}[hidden]{display:none}.bg-app{background-color:var(--app-background)}.bg-app-subtle{background-color:var(--app-background-subtle)}.bg-element{background-color:var(--element-background)}.bg-element-hover{background-color:var(--element-background-hover)}.bg-element-strong{background-color:var(--element-background-strong)}.bg-solid{background-color:var(--solid-background)}.bg-solid-hover{background-color:var(--solid-background-hover)}.border-app{border:1px solid var(--app-border)}.border-element-subtle{border:1px solid var(--element-border-subtle)}.border-element-strong{border:1px solid var(--element-border-strong)}.text-high-contrast{color:var(--text-high-contrast)}.text-low-contrast{color:var(--text-low-contrast)}.text-xs{font-size:var(--text-xs)}.text-sm{font-size:var(--text-sm)}.text-md{font-size:var(--text-md)}.text-lg{font-size:var(--text-lg)}.text-xl{font-size:var(--text-xl)}.text-2xl{font-size:var(--text-2xl)}.text-3xl{font-size:var(--text-3xl)}.text-4xl{font-size:var(--text-4xl)}.text-5xl{font-size:var(--text-5xl)}.p-2xs{padding:var(--space-2xs)}.p-xs{padding:var(--space-xs)}.p-sm{padding:var(--space-sm)}.p-md{padding:var(--space-md)}.p-lg{padding:var(--space-lg)}.p-xl{padding:var(--space-xl)}.p-2xl{padding:var(--space-2xl)}.p-3xl{padding:var(--space-3xl)}.p-4xl{padding:var(--space-4xl)}.p-5xl{padding:var(--space-5xl)}.px-2xs{padding-left:var(--space-2xs);padding-right:var(--space-2xs)}.px-xs{padding-left:var(--space-xs);padding-right:var(--space-xs)}.px-sm{padding-left:var(--space-sm);padding-right:var(--space-sm)}.px-md{padding-left:var(--space-md);padding-right:var(--space-md)}.px-lg{padding-left:var(--space-lg);padding-right:var(--space-lg)}.px-xl{padding-left:var(--space-xl);padding-right:var(--space-xl)}.px-2xl{padding-left:var(--space-2xl);padding-right:var(--space-2xl)}.px-3xl{padding-left:var(--space-3xl);padding-right:var(--space-3xl)}.px-4xl{padding-left:var(--space-4xl);padding-right:var(--space-4xl)}.px-5xl{padding-left:var(--space-5xl);padding-right:var(--space-5xl)}.py-2xs{padding-bottom:var(--space-2xs);padding-top:var(--space-2xs)}.py-xs{padding-bottom:var(--space-xs);padding-top:var(--space-xs)}.py-sm{padding-bottom:var(--space-sm);padding-top:var(--space-sm)}.py-md{padding-bottom:var(--space-md);padding-top:var(--space-md)}.py-lg{padding-bottom:var(--space-lg);padding-top:var(--space-lg)}.py-xl{padding-bottom:var(--space-xl);padding-top:var(--space-xl)}.py-2xl{padding-bottom:var(--space-2xl);padding-top:var(--space-2xl)}.py-3xl{padding-bottom:var(--space-3xl);padding-top:var(--space-3xl)}.py-4xl{padding-bottom:var(--space-4xl);padding-top:var(--space-4xl)}.py-5xl{padding-bottom:var(--space-5xl);padding-top:var(--space-5xl)}.pt-2xs{padding-top:var(--space-2xs)}.pt-xs{padding-top:var(--space-xs)}.pt-sm{padding-top:var(--space-sm)}.pt-md{padding-top:var(--space-md)}.pt-lg{padding-top:var(--space-lg)}.pt-xl{padding-top:var(--space-xl)}.pt-2xl{padding-top:var(--space-2xl)}.pt-3xl{padding-top:var(--space-3xl)}.pt-4xl{padding-top:var(--space-4xl)}.pt-5xl{padding-top:var(--space-5xl)}.pr-2xs{padding-right:var(--space-2xs)}.pr-xs{padding-right:var(--space-xs)}.pr-sm{padding-right:var(--space-sm)}.pr-md{padding-right:var(--space-md)}.pr-lg{padding-right:var(--space-lg)}.pr-xl{padding-right:var(--space-xl)}.pr-2xl{padding-right:var(--space-2xl)}.pr-3xl{padding-right:var(--space-3xl)}.pr-4xl{padding-right:var(--space-4xl)}.pr-5xl{padding-right:var(--space-5xl)}.pb-2xs{padding-bottom:var(--space-2xs)}.pb-xs{padding-bottom:var(--space-xs)}.pb-sm{padding-bottom:var(--space-sm)}.pb-md{padding-bottom:var(--space-md)}.pb-lg{padding-bottom:var(--space-lg)}.pb-xl{padding-bottom:var(--space-xl)}.pb-2xl{padding-bottom:var(--space-2xl)}.pb-3xl{padding-bottom:var(--space-3xl)}.pb-4xl{padding-bottom:var(--space-4xl)}.pb-5xl{padding-bottom:var(--space-5xl)}.m-2xs{margin:var(--space-2xs)}.m-xs{margin:var(--space-xs)}.m-sm{margin:var(--space-sm)}.m-md{margin:var(--space-md)}.m-lg{margin:var(--space-lg)}.m-xl{margin:var(--space-xl)}.m-2xl{margin:var(--space-2xl)}.m-3xl{margin:var(--space-3xl)}.m-4xl{margin:var(--space-4xl)}.m-5xl{margin:var(--space-5xl)}.mx-2xs{margin-left:var(--space-2xs);margin-right:var(--space-2xs)}.mx-xs{margin-left:var(--space-xs);margin-right:var(--space-xs)}.mx-sm{margin-left:var(--space-sm);margin-right:var(--space-sm)}.mx-md{margin-left:var(--space-md);margin-right:var(--space-md)}.mx-lg{margin-left:var(--space-lg);margin-right:var(--space-lg)}.mx-xl{margin-left:var(--space-xl);margin-right:var(--space-xl)}.mx-2xl{margin-left:var(--space-2xl);margin-right:var(--space-2xl)}.mx-3xl{margin-left:var(--space-3xl);margin-right:var(--space-3xl)}.mx-4xl{margin-left:var(--space-4xl);margin-right:var(--space-4xl)}.mx-5xl{margin-left:var(--space-5xl);margin-right:var(--space-5xl)}.my-2xs{margin-bottom:var(--space-2xs);margin-top:var(--space-2xs)}.my-xs{margin-bottom:var(--space-xs);margin-top:var(--space-xs)}.my-sm{margin-bottom:var(--space-sm);margin-top:var(--space-sm)}.my-md{margin-bottom:var(--space-md);margin-top:var(--space-md)}.my-lg{margin-bottom:var(--space-lg);margin-top:var(--space-lg)}.my-xl{margin-bottom:var(--space-xl);margin-top:var(--space-xl)}.my-2xl{margin-bottom:var(--space-2xl);margin-top:var(--space-2xl)}.my-3xl{margin-bottom:var(--space-3xl);margin-top:var(--space-3xl)}.my-4xl{margin-bottom:var(--space-4xl);margin-top:var(--space-4xl)}.my-5xl{margin-bottom:var(--space-5xl);margin-top:var(--space-5xl)}.mt-2xs{margin-top:var(--space-2xs)}.mt-xs{margin-top:var(--space-xs)}.mt-sm{margin-top:var(--space-sm)}.mt-md{margin-top:var(--space-md)}.mt-lg{margin-top:var(--space-lg)}.mt-xl{margin-top:var(--space-xl)}.mt-2xl{margin-top:var(--space-2xl)}.mt-3xl{margin-top:var(--space-3xl)}.mt-4xl{margin-top:var(--space-4xl)}.mt-5xl{margin-top:var(--space-5xl)}.mr-2xs{margin-right:var(--space-2xs)}.mr-xs{margin-right:var(--space-xs)}.mr-sm{margin-right:var(--space-sm)}.mr-md{margin-right:var(--space-md)}.mr-lg{margin-right:var(--space-lg)}.mr-xl{margin-right:var(--space-xl)}.mr-2xl{margin-right:var(--space-2xl)}.mr-3xl{margin-right:var(--space-3xl)}.mr-4xl{margin-right:var(--space-4xl)}.mr-5xl{margin-right:var(--space-5xl)}.mb-2xs{margin-bottom:var(--space-2xs)}.mb-xs{margin-bottom:var(--space-xs)}.mb-sm{margin-bottom:var(--space-sm)}.mb-md{margin-bottom:var(--space-md)}.mb-lg{margin-bottom:var(--space-lg)}.mb-xl{margin-bottom:var(--space-xl)}.mb-2xl{margin-bottom:var(--space-2xl)}.mb-3xl{margin-bottom:var(--space-3xl)}.mb-4xl{margin-bottom:var(--space-4xl)}.mb-5xl{margin-bottom:var(--space-5xl)}.ml-2xs{margin-left:var(--space-2xs)}.ml-xs{margin-left:var(--space-xs)}.ml-sm{margin-left:var(--space-sm)}.ml-md{margin-left:var(--space-md)}.ml-lg{margin-left:var(--space-lg)}.ml-xl{margin-left:var(--space-xl)}.ml-2xl{margin-left:var(--space-2xl)}.ml-3xl{margin-left:var(--space-3xl)}.ml-4xl{margin-left:var(--space-4xl)}.ml-5xl{margin-left:var(--space-5xl)}.font-base{font-family:var(--font-base)}.font-alt{font-family:var(--font-alt)}.font-mono{font-family:var(--font-mono)}.shadow-sm{box-shadow:var(--shadow-sm)}.shadow-md{box-shadow:var(--shadow-md)}.shadow-lg{box-shadow:var(--shadow-lg)}:root{--primary-app-background:#fdfdff;--primary-app-background-subtle:#fafaff;--primary-app-border:#d0d0fa;--primary-element-background:#f3f3ff;--primary-element-background-hover:#ebebfe;--primary-element-background-strong:#e0e0fd;--primary-element-border-subtle:#babbf5;--primary-element-border-strong:#9b9ef0;--primary-solid-background:#5b5bd6;--primary-solid-background-hover:#5353ce;--primary-text-high-contrast:#272962;--primary-text-low-contrast:#4747c2;--greyscale-app-background:#fcfcfd;--greyscale-app-background-subtle:#f9f9fb;--greyscale-app-border:#dddde3;--greyscale-element-background:#f2f2f5;--greyscale-element-background-hover:#ebebef;--greyscale-element-background-strong:#e4e4e9;--greyscale-element-border-subtle:#d3d4db;--greyscale-element-border-strong:#b9bbc6;--greyscale-solid-background:#8b8d98;--greyscale-solid-background-hover:#7e808a;--greyscale-text-high-contrast:#1c2024;--greyscale-text-low-contrast:#60646c;--error-app-background:#fffcfc;--error-app-background-subtle:#fff7f7;--error-app-border:#f9c6c6;--error-element-background:#ffefef;--error-element-background-hover:#ffe5e5;--error-element-background-strong:#fdd8d8;--error-element-border-subtle:#f3aeaf;--error-element-border-strong:#eb9091;--error-solid-background:#e5484d;--error-solid-background-hover:#d93d42;--error-text-high-contrast:#641723;--error-text-low-contrast:#c62a2f;--success-app-background:#fbfefc;--success-app-background-subtle:#f2fcf5;--success-app-border:#b4dfc4;--success-element-background:#e9f9ee;--success-element-background-hover:#ddf3e4;--success-element-background-strong:#ccebd7;--success-element-border-subtle:#92ceac;--success-element-border-strong:#5bb98c;--success-solid-background:#30a46c;--success-solid-background-hover:#299764;--success-text-high-contrast:#193b2d;--success-text-low-contrast:#18794e;--warning-app-background:#fdfdf9;--warning-app-background-subtle:#fffbe0;--warning-app-border:#ecdd85;--warning-element-background:#fff8c6;--warning-element-background-hover:#fcf3af;--warning-element-background-strong:#f7ea9b;--warning-element-border-subtle:#dac56e;--warning-element-border-strong:#c9aa45;--warning-solid-background:#fbe32d;--warning-solid-background-hover:#f9da10;--warning-text-high-contrast:#473b1f;--warning-text-low-contrast:#775f28;--info-app-background:#fbfdff;--info-app-background-subtle:#f5faff;--info-app-border:#b7d9f8;--info-element-background:#edf6ff;--info-element-background-hover:#e1f0ff;--info-element-background-strong:#cee7fe;--info-element-border-subtle:#96c7f2;--info-element-border-strong:#5eb0ef;--info-solid-background:#0091ff;--info-solid-background-hover:#0880ea;--info-text-high-contrast:#113264;--info-text-low-contrast:#0b68cb;--app-background:var(--primary-app-background);--app-background-subtle:var(--primary-app-background-subtle);--app-border:var(--primary-app-border);--element-background:var(--primary-element-background);--element-background-hover:var(--primary-element-background-hover);--element-background-strong:var(--primary-element-background-strong);--element-border-subtle:var(--primary-element-border-subtle);--element-border-strong:var(--primary-element-border-strong);--solid-background:var(--primary-solid-background);--solid-background-hover:var(--primary-solid-background-hover);--text-high-contrast:var(--primary-text-high-contrast);--text-low-contrast:var(--primary-text-low-contrast);--text-xs:calc(var(--text-sm)/1.25);--text-sm:calc(var(--text-md)/1.25);--text-md:14px;--text-lg:calc(var(--text-md)*1.25);--text-xl:calc(var(--text-lg)*1.25);--text-2xl:calc(var(--text-xl)*1.25);--text-3xl:calc(var(--text-2xl)*1.25);--text-4xl:calc(var(--text-3xl)*1.25);--text-5xl:calc(var(--text-4xl)*1.25);--space-2xs:0.25rem;--space-xs:0.5rem;--space-sm:0.75rem;--space-md:1rem;--space-lg:1.25rem;--space-xl:2rem;--space-2xl:3.25rem;--space-3xl:5.25rem;--space-4xl:8.5rem;--space-5xl:13.75rem;--font-base:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";--font-alt:ui-serif,Georgia,Cambria,"Times New Roman",Times,serif;--font-mono:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;--border-radius:4px;--shadow-sm:0 1px 2px 0 rgba(0,0,0,.05);--shadow-md:0 4px 6px -1px rgba(0,0,0,.1),0 2px 4px -2px rgba(0,0,0,.1);--shadow-lg:0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.1)}[data-variant=primary]{--app-background:var(--primary-app-background);--app-background-subtle:var(--primary-app-background-subtle);--app-border:var(--primary-app-border);--element-background:var(--primary-element-background);--element-background-hover:var(--primary-element-background-hover);--element-background-strong:var(--primary-element-background-strong);--element-border-subtle:var(--primary-element-border-subtle);--element-border-strong:var(--primary-element-border-strong);--solid-background:var(--primary-solid-background);--solid-background-hover:var(--primary-solid-background-hover);--text-high-contrast:var(--primary-text-high-contrast);--text-low-contrast:var(--primary-text-low-contrast);color:var(--text-high-contrast)}[data-variant=greyscale]{--app-background:var(--greyscale-app-background);--app-background-subtle:var(--greyscale-app-background-subtle);--app-border:var(--greyscale-app-border);--element-background:var(--greyscale-element-background);--element-background-hover:var(--greyscale-element-background-hover);--element-background-strong:var(--greyscale-element-background-strong);--element-border-subtle:var(--greyscale-element-border-subtle);--element-border-strong:var(--greyscale-element-border-strong);--solid-background:var(--greyscale-solid-background);--solid-background-hover:var(--greyscale-solid-background-hover);--text-high-contrast:var(--greyscale-text-high-contrast);--text-low-contrast:var(--greyscale-text-low-contrast);color:var(--text-high-contrast)}[data-variant=error]{--app-background:var(--error-app-background);--app-background-subtle:var(--error-app-background-subtle);--app-border:var(--error-app-border);--element-background:var(--error-element-background);--element-background-hover:var(--error-element-background-hover);--element-background-strong:var(--error-element-background-strong);--element-border-subtle:var(--error-element-border-subtle);--element-border-strong:var(--error-element-border-strong);--solid-background:var(--error-solid-background);--solid-background-hover:var(--error-solid-background-hover);--text-high-contrast:var(--error-text-high-contrast);--text-low-contrast:var(--error-text-low-contrast);color:var(--text-high-contrast)}[data-variant=success]{--app-background:var(--success-app-background);--app-background-subtle:var(--success-app-background-subtle);--app-border:var(--success-app-border);--element-background:var(--success-element-background);--element-background-hover:var(--success-element-background-hover);--element-background-strong:var(--success-element-background-strong);--element-border-subtle:var(--success-element-border-subtle);--element-border-strong:var(--success-element-border-strong);--solid-background:var(--success-solid-background);--solid-background-hover:var(--success-solid-background-hover);--text-high-contrast:var(--success-text-high-contrast);--text-low-contrast:var(--success-text-low-contrast);color:var(--text-high-contrast)}[data-variant=warning]{--app-background:var(--warning-app-background);--app-background-subtle:var(--warning-app-background-subtle);--app-border:var(--warning-app-border);--element-background:var(--warning-element-background);--element-background-hover:var(--warning-element-background-hover);--element-background-strong:var(--warning-element-background-strong);--element-border-subtle:var(--warning-element-border-subtle);--element-border-strong:var(--warning-element-border-strong);--solid-background:var(--warning-solid-background);--solid-background-hover:var(--warning-solid-background-hover);--text-high-contrast:var(--warning-text-high-contrast);--text-low-contrast:var(--warning-text-low-contrast);color:var(--text-high-contrast)}[data-variant=info]{--app-background:var(--info-app-background);--app-background-subtle:var(--info-app-background-subtle);--app-border:var(--info-app-border);--element-background:var(--info-element-background);--element-background-hover:var(--info-element-background-hover);--element-background-strong:var(--info-element-background-strong);--element-border-subtle:var(--info-element-border-subtle);--element-border-strong:var(--info-element-border-strong);--solid-background:var(--info-solid-background);--solid-background-hover:var(--info-solid-background-hover);--text-high-contrast:var(--info-text-high-contrast);--text-low-contrast:var(--info-text-low-contrast);color:var(--text-high-contrast)}.lustre-ui-alert,.use-lustre-ui .alert{--bg:var(--element-background);--border:var(--element-border-subtle);--text:var(--text-high-contrast);background-color:var(--bg);border:1px solid var(--border);border-radius:var(--border-radius);box-shadow:var(--shadow-sm);padding:var(--space-sm)}.clear:is(.use-lustre-ui .alert,.lustre-ui-alert){--bg:unsert}.lustre-ui-aside,.use-lustre-ui .aside{--align:start;--gap:var(--space-md);--dir:row;--wrap:wrap;--min:60%;align-items:var(--align);display:flex;flex-direction:var(--dir);flex-wrap:var(--wrap);gap:var(--gap)}.content-first:is(.use-lustre-ui .aside,.lustre-ui-aside){--dir:row;--wrap:wrap}.content-last:is(.use-lustre-ui .aside,.lustre-ui-aside){--dir:row-reverse;--wrap:wrap-reverse}.align-start:is(.use-lustre-ui .aside,.lustre-ui-aside){--align:start}.align-center:is(.use-lustre-ui .aside,.lustre-ui-aside),.align-centre:is(.use-lustre-ui .aside,.lustre-ui-aside){--align:center}.align-end:is(.use-lustre-ui .aside,.lustre-ui-aside){--align:end}.stretch:is(.use-lustre-ui .aside,.lustre-ui-aside){--align:stretch}.packed:is(.use-lustre-ui .aside,.lustre-ui-aside){--gap:0}.tight:is(.use-lustre-ui .aside,.lustre-ui-aside){--gap:var(--space-xs)}.relaxed:is(.use-lustre-ui .aside,.lustre-ui-aside){--gap:var(--space-md)}.loose:is(.use-lustre-ui .aside,.lustre-ui-aside){--gap:var(--space-lg)}:is(.use-lustre-ui .aside,.lustre-ui-aside)>:first-child{flex-basis:0;flex-grow:999;min-inline-size:var(--min)}:is(.use-lustre-ui .aside,.lustre-ui-aside)>:last-child{flex-grow:1;max-height:-moz-max-content;max-height:max-content}.lustre-ui-box,.use-lustre-ui .box{--gap:var(--space-sm);padding:var(--gap)}.packed:is(.use-lustre-ui .box,.lustre-ui-box){--gap:0}.tight:is(.use-lustre-ui .box,.lustre-ui-box){--gap:var(--space-xs)}.relaxed:is(.use-lustre-ui .box,.lustre-ui-box){--gap:var(--space-md)}.loose:is(.use-lustre-ui .box,.lustre-ui-box){--gap:var(--space-lg)}.lustre-ui-breadcrumbs,.use-lustre-ui .breadcrumbs{--gap:var(--space-sm);--align:center;align-items:var(--align);display:flex;flex-wrap:nowrap;gap:var(--gap);justify-content:start;overflow-x:auto}.tight:is(.use-lustre-ui .breadcrumbs,.lustre-ui-breadcrumbs){--gap:var(--space-xs)}.relaxed:is(.use-lustre-ui .breadcrumbs,.lustre-ui-breadcrumbs){--gap:var(--space-sm)}.loose:is(.use-lustre-ui .breadcrumbs,.lustre-ui-breadcrumbs){--gap:var(--space-md)}.align-start:is(.use-lustre-ui .breadcrumbs,.lustre-ui-breadcrumbs){--align:start}.align-center:is(.use-lustre-ui .breadcrumbs,.lustre-ui-breadcrumbs),.align-centre:is(.use-lustre-ui .breadcrumbs,.lustre-ui-breadcrumbs){--align:center}.align-end:is(.use-lustre-ui .breadcrumbs,.lustre-ui-breadcrumbs){--align:end}:is(.use-lustre-ui .breadcrumbs,.lustre-ui-breadcrumbs)>*{flex:0 0 auto}:is(.use-lustre-ui .breadcrumbs,.lustre-ui-breadcrumbs):not(:has(.active))>:last-child,:is(.use-lustre-ui .breadcrumbs,.lustre-ui-breadcrumbs)>.active{color:var(--text-low-contrast)}.lustre-ui-button,.use-lustre-ui .button,.use-lustre-ui button{--bg-active:var(--element-background-strong);--bg-hover:var(--element-background-hover);--bg:var(--element-background);--border-active:var(--bg-active);--border:var(--bg);--text:var(--text-high-contrast);--padding-y:var(--space-xs);--padding-x:var(--space-sm);background-color:var(--bg);border:1px solid var(--border,var(--bg),var(--element-border-subtle));border-radius:var(--border-radius);color:var(--text);padding:var(--padding-y) var(--padding-x)}:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button):focus-within,:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button):hover{background-color:var(--bg-hover)}:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button):focus-within:active,:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button):hover:active{background-color:var(--bg-active);border-color:var(--border-active)}.small:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button){--padding-y:var(--space-2xs);--padding-x:var(--space-xs)}.solid:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button){--bg-active:var(--solid-background-hover);--bg-hover:var(--solid-background-hover);--bg:var(--solid-background);--border-active:var(--solid-background-hover);--border:var(--solid-background);--text:#fff}.solid:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button):focus-within:active,.solid:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button):hover:active{--bg-active:color-mix(in srgb,var(--solid-background-hover) 90%,#000);--border-active:color-mix(in srgb,var(--solid-background-hover) 90%,#000)}.soft:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button){--bg-active:var(--element-background-strong);--bg-hover:var(--element-background-hover);--bg:var(--element-background);--border-active:var(--bg-active);--border:var(--bg);--text:var(--text-high-contrast)}.outline:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button){--bg:unset;--border:var(--element-border-subtle)}.clear:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button){--bg:unset;--border:unset}.lustre-ui-center,.lustre-ui-centre,.use-lustre-ui .center,.use-lustre-ui .centre{--display:flex;align-items:center;display:var(--display);justify-content:center}.inline:is(.use-lustre-ui .centre,.use-lustre-ui .center,.lustre-ui-centre,.lustre-ui-center){--display:inline-flex}.lustre-ui-cluster,.use-lustre-ui .cluster{--gap:var(--space-md);--dir:flex-start;--align:center;align-items:var(--align);display:flex;flex-wrap:wrap;gap:var(--gap);justify-content:var(--dir)}.packed:is(.use-lustre-ui .cluster,.lustre-ui-cluster){--gap:0}.tight:is(.use-lustre-ui .cluster,.lustre-ui-cluster){--gap:var(--space-xs)}.relaxed:is(.use-lustre-ui .cluster,.lustre-ui-cluster){--gap:var(--space-md)}.loose:is(.use-lustre-ui .cluster,.lustre-ui-cluster){--gap:var(--space-lg)}.from-start:is(.use-lustre-ui .cluster,.lustre-ui-cluster){--dir:flex-start}.from-end:is(.use-lustre-ui .cluster,.lustre-ui-cluster){--dir:flex-end}.align-start:is(.use-lustre-ui .cluster,.lustre-ui-cluster){--align:start}.align-center:is(.use-lustre-ui .cluster,.lustre-ui-cluster),.align-centre:is(.use-lustre-ui .cluster,.lustre-ui-cluster){--align:center}.align-end:is(.use-lustre-ui .cluster,.lustre-ui-cluster){--align:end}.stretch:is(.use-lustre-ui .cluster,.lustre-ui-cluster){--align:stretch}.lustre-ui-field,.use-lustre-ui .field{--label:var(--text-high-contrast);--label-align:start;--message:var(--text-low-contrast);--message-align:end;--text-size:var(--text-md)}.small:is(.use-lustre-ui .field,.lustre-ui-field){--text-size:var(--text-sm)}.label-start:is(.use-lustre-ui .field,.lustre-ui-field){--label-align:start}.label-center:is(.use-lustre-ui .field,.lustre-ui-field),.label-centre:is(.use-lustre-ui .field,.lustre-ui-field){--label-align:center}.label-end:is(.use-lustre-ui .field,.lustre-ui-field){--label-align:end}.message-start:is(.use-lustre-ui .field,.lustre-ui-field){--message-align:start}.message-center:is(.use-lustre-ui .field,.lustre-ui-field),.message-centre:is(.use-lustre-ui .field,.lustre-ui-field){--message-align:center}.message-end:is(.use-lustre-ui .field,.lustre-ui-field){--message-align:end}:is(.use-lustre-ui .field,.lustre-ui-field):has(input:disabled)>:is(.label,.message){opacity:.5}:is(.use-lustre-ui .field,.lustre-ui-field)>:not(input){color:var(--label);font-size:var(--text-size)}:is(.use-lustre-ui .field,.lustre-ui-field)>.label{display:inline-flex;justify-content:var(--label-align)}:is(.use-lustre-ui .field,.lustre-ui-field)>.message{color:var(--message);display:inline-flex;justify-content:var(--message-align)}.lustre-ui-group,.use-lustre-ui .group{align-items:stretch;display:inline-flex}:is(.use-lustre-ui .group,.lustre-ui-group)>:first-child{border-radius:var(--border-radius) 0 0 var(--border-radius)!important}:is(.use-lustre-ui .group,.lustre-ui-group)>:not(:first-child):not(:last-child){border-radius:0!important}:is(.use-lustre-ui .group,.lustre-ui-group)>:last-child{border-radius:0 var(--border-radius) var(--border-radius) 0!important}.lustre-ui-icon,.use-lustre-ui .icon{--size:1em;display:inline;height:var(--size);width:var(--size)}.xs:is(.use-lustre-ui .icon,.lustre-ui-icon){--size:var(--text-xs)}.sm:is(.use-lustre-ui .icon,.lustre-ui-icon){--size:var(--text-sm)}.md:is(.use-lustre-ui .icon,.lustre-ui-icon){--size:var(--text-md)}.lg:is(.use-lustre-ui .icon,.lustre-ui-icon){--size:var(--text-lg)}.xl:is(.use-lustre-ui .icon,.lustre-ui-icon){--size:var(--text-xl)}.lustre-ui-input,.use-lustre-ui .input,.use-lustre-ui input:not([type~="checkbox file radio range"]){--border-active:var(--element-border-strong);--border:var(--element-border-subtle);--outline:var(--element-border-subtle);--text:var(--text-high-contrast);--text-placeholder:var(--text-low-contrast);--padding-y:var(--space-xs);--padding-x:var(--space-sm);border:1px solid var(--border,var(--bg),var(--element-border-subtle));border-radius:var(--border-radius);color:var(--text);padding:var(--padding-y) var(--padding-x)}:is(.use-lustre-ui input:not([type~="checkbox file radio range"]),.use-lustre-ui .input,.lustre-ui-input):hover{border-color:var(--border-active)}:is(.use-lustre-ui input:not([type~="checkbox file radio range"]),.use-lustre-ui .input,.lustre-ui-input):focus-within{border-color:var(--border-active);outline:1px solid var(--outline);outline-offset:2px}:is(.use-lustre-ui input:not([type~="checkbox file radio range"]),.use-lustre-ui .input,.lustre-ui-input)::-moz-placeholder{color:var(--text-placeholder)}:is(.use-lustre-ui input:not([type~="checkbox file radio range"]),.use-lustre-ui .input,.lustre-ui-input)::placeholder{color:var(--text-placeholder)}:is(.use-lustre-ui input:not([type~="checkbox file radio range"]),.use-lustre-ui .input,.lustre-ui-input):disabled{opacity:.5}.clear:is(.use-lustre-ui input:not([type~="checkbox file radio range"]),.use-lustre-ui .input,.lustre-ui-input){--border:unset}.lustre-ui-prose,.use-lustre-ui .prose{--width:60ch;width:var(--width)}.wide:is(.use-lustre-ui .prose,.lustre-ui-prose){--width:80ch}.full:is(.use-lustre-ui .prose,.lustre-ui-prose){--width:100%}:is(.use-lustre-ui .prose,.lustre-ui-prose) *+*{margin-top:var(--space-md)}:is(.use-lustre-ui .prose,.lustre-ui-prose) :not(h1,h2,h3,h4,h5,h6)+:is(h1,h2,h3,h4,h5,h6){margin-top:var(--space-xl)}:is(.use-lustre-ui .prose,.lustre-ui-prose) h1{font-size:var(--text-3xl)}:is(.use-lustre-ui .prose,.lustre-ui-prose) h2{font-size:var(--text-2xl)}:is(.use-lustre-ui .prose,.lustre-ui-prose) h3{font-size:var(--text-xl)}:is(.use-lustre-ui .prose,.lustre-ui-prose) :is(h4,h5,h6){font-size:var(--text-lg)}:is(.use-lustre-ui .prose,.lustre-ui-prose) img{border-radius:var(--border-radius);display:block;height:auto;-o-object-fit:cover;object-fit:cover;width:100%}:is(.use-lustre-ui .prose,.lustre-ui-prose) ul{list-style:disc}:is(.use-lustre-ui .prose,.lustre-ui-prose) ol{list-style:decimal}:is(.use-lustre-ui .prose,.lustre-ui-prose) :is(ul,ol,dl){padding-left:var(--space-xl)}:is(:is(.use-lustre-ui .prose,.lustre-ui-prose) :is(ul,ol,dl))>*+*{margin-top:var(--space-md)}:is(.use-lustre-ui .prose,.lustre-ui-prose) li::marker{color:var(--text-low-contrast)}:is(.use-lustre-ui .prose,.lustre-ui-prose) pre{background-color:var(--greyscale-element-background);border-radius:var(--border-radius);overflow-x:auto;padding:var(--space-sm) var(--space-md)}:is(.use-lustre-ui .prose,.lustre-ui-prose) pre>code{background-color:transparent;border-radius:0;color:inherit;font-size:var(--text-md);padding:0}:is(.use-lustre-ui .prose,.lustre-ui-prose) blockquote{border-left:4px solid var(--element-border-subtle);padding-left:var(--space-xl);quotes:"\\201C""\\201D""\\2018""\\2019"}:is(.use-lustre-ui .prose,.lustre-ui-prose) blockquote>*{font-style:italic}:is(:is(.use-lustre-ui .prose,.lustre-ui-prose) blockquote)>*+*{margin-top:var(--space-sm)}:is(.use-lustre-ui .prose,.lustre-ui-prose) blockquote>:first-child:before{content:open-quote}:is(.use-lustre-ui .prose,.lustre-ui-prose) blockquote>:last-child:after{content:close-quote}:is(.use-lustre-ui .prose,.lustre-ui-prose) a[href]{color:var(--text-low-contrast);text-decoration:underline}:is(.use-lustre-ui .prose,.lustre-ui-prose) a[href]:visited{color:var(--text-high-contrast)}:is(.use-lustre-ui .prose,.lustre-ui-prose) :is(code,kbd){background-color:var(--greyscale-element-background);border-radius:var(--border-radius)}:is(.use-lustre-ui .prose,.lustre-ui-prose) :not(pre) code{color:var(--text-high-contrast)}:is(.use-lustre-ui .prose,.lustre-ui-prose) :not(pre) code:after,:is(.use-lustre-ui .prose,.lustre-ui-prose) :not(pre) code:before{content:"\\`"}:is(.use-lustre-ui .prose,.lustre-ui-prose) kbd{border-color:var(--greyscale-element-border-strong);border-width:1px;font-weight:700;padding:0 var(--space-2xs)}.lustre-ui-sequence,.use-lustre-ui .sequence{--gap:var(--space-md);--break:30rem;display:flex;flex-wrap:wrap;gap:var(--gap)}.packed:is(.use-lustre-ui .sequence,.lustre-ui-sequence){--gap:0}.tight:is(.use-lustre-ui .sequence,.lustre-ui-sequence){--gap:var(--space-xs)}.relaxed:is(.use-lustre-ui .sequence,.lustre-ui-sequence){--gap:var(--space-md)}.loose:is(.use-lustre-ui .sequence,.lustre-ui-sequence){--gap:var(--space-lg)}[data-split-at="3"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+3),[data-split-at="3"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+3)~*{flex-basis:100%}[data-split-at="4"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+4),[data-split-at="4"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+4)~*{flex-basis:100%}[data-split-at="5"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+5),[data-split-at="5"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+5)~*{flex-basis:100%}[data-split-at="6"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+6),[data-split-at="6"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+6)~*{flex-basis:100%}[data-split-at="7"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+7),[data-split-at="7"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+7)~*{flex-basis:100%}[data-split-at="8"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+8),[data-split-at="8"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+8)~*{flex-basis:100%}[data-split-at="9"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+9),[data-split-at="9"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+9)~*{flex-basis:100%}[data-split-at="10"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+10),[data-split-at="10"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+10)~*{flex-basis:100%}:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>*{flex-basis:calc((var(--break) - 100%)*999);flex-grow:1}.lustre-ui-stack,.use-lustre-ui .stack{--gap:var(--space-md);display:flex;flex-direction:column;gap:var(--gap);justify-content:flex-start}.packed:is(.use-lustre-ui .stack,.lustre-ui-stack){--gap:0}.tight:is(.use-lustre-ui .stack,.lustre-ui-stack){--gap:var(--space-xs)}.relaxed:is(.use-lustre-ui .stack,.lustre-ui-stack){--gap:var(--space-md)}.loose:is(.use-lustre-ui .stack,.lustre-ui-stack){--gap:var(--space-lg)}.lustre-ui-tag,.use-lustre-ui .tag{--bg-active:var(--element-background-strong);--bg-hover:var(--element-background-hover);--bg:var(--element-background);--border-active:var(--bg-active);--border:var(--bg);--text:var(--text-high-contrast);background-color:var(--bg);border:1px solid var(--border,var(--bg),var(--element-border-subtle));border-radius:var(--border-radius);color:var(--text);font-size:var(--text-sm);padding:0 var(--space-xs)}:is(.use-lustre-ui .tag,.lustre-ui-tag):is(button,a,[tabindex]){cursor:pointer;-webkit-user-select:none;-moz-user-select:none;user-select:none}:is(.use-lustre-ui .tag,.lustre-ui-tag):is(button,a,[tabindex]):focus-within,:is(.use-lustre-ui .tag,.lustre-ui-tag):is(button,a,[tabindex]):hover{background-color:var(--bg-hover)}:is(.use-lustre-ui .tag,.lustre-ui-tag):is(button,a,[tabindex]):focus-within:active,:is(.use-lustre-ui .tag,.lustre-ui-tag):is(button,a,[tabindex]):hover:active{background-color:var(--bg-active);border-color:var(--border-active)}.solid:is(.use-lustre-ui .tag,.lustre-ui-tag){--bg-active:var(--solid-background-hover);--bg-hover:var(--solid-background-hover);--bg:var(--solid-background);--border-active:var(--solid-background-hover);--border:var(--solid-background);--text:#fff}.solid:is(.use-lustre-ui .tag,.lustre-ui-tag):is(button,a,[tabindex]):focus-within:active,.solid:is(.use-lustre-ui .tag,.lustre-ui-tag):is(button,a,[tabindex]):hover:active{--bg-active:color-mix(in srgb,var(--solid-background-hover) 90%,#000);--border-active:color-mix(in srgb,var(--solid-background-hover) 90%,#000)}.soft:is(.use-lustre-ui .tag,.lustre-ui-tag){--bg-active:var(--element-background-strong);--bg-hover:var(--element-background-hover);--bg:var(--element-background);--border-active:var(--bg-active);--border:var(--bg);--text:var(--text-high-contrast)}.outline:is(.use-lustre-ui .tag,.lustre-ui-tag){--bg:unset;--border:var(--element-border-subtle)}\n';
function elements2() {
  return style2(toList([]), element_css);
}

// build/dev/javascript/app/app.mjs
var Model2 = class extends CustomType {
  constructor(dummy, count) {
    super();
    this.dummy = dummy;
    this.count = count;
  }
};
var UserIncrementedCount = class extends CustomType {
};
var UserDecrementedCount = class extends CustomType {
};
function init2(_) {
  return new Model2(void 0, 0);
}
function update(model, msg) {
  if (msg instanceof UserIncrementedCount) {
    return model.withFields({ count: model.count + 1 });
  } else {
    let $ = model.count;
    if ($ === 0) {
      return model;
    } else {
      return model.withFields({ count: model.count - 1 });
    }
  }
}
function view(model) {
  let styles = toList([
    ["width", "100vw"],
    ["height", "100vh"],
    ["padding", "1rem"]
  ]);
  let button_styles = toList([["border-radius", "30%"]]);
  let count = to_string(model.count);
  return div(
    toList([]),
    toList([
      elements2(),
      centre2(
        toList([style(styles)]),
        sequence2(
          toList([
            breakpoint("unset"),
            style(toList([["align-items", "baseline"]]))
          ]),
          toList([
            button3(
              toList([
                solid(),
                primary(),
                style(button_styles),
                on_click(new UserDecrementedCount())
              ]),
              toList([text("-")])
            ),
            p(
              toList([style(toList([["text-align", "center"]]))]),
              toList([text(count)])
            ),
            button3(
              toList([
                solid(),
                primary(),
                style(button_styles),
                on_click(new UserIncrementedCount())
              ]),
              toList([text("+")])
            )
          ])
        )
      )
    ])
  );
}
function main() {
  let app = simple(init2, update, view);
  let $ = start2(app, "#app", void 0);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "app",
      23,
      "main",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  return void 0;
}

// build/.lustre/entry.mjs
main();
