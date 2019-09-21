/**
 * RxChangeEvents a emitted when something in the database changes
 * they can be grabbed by the observables of database, collection and document
 */

import {
    hash
} from './util';

import {
    RxDatabase
} from './rx-database';
import {
    RxCollection
} from './rx-collection';

export class RxChangeEvent {
    constructor(
        public data
    ) { }
    toJSON() {
        const ret = {
            col: null,
            doc: null,
            v: null,
            op: this.data.op,
            t: this.data.t,
            db: this.data.db,
            it: this.data.it,
            isLocal: this.data.isLocal
        };
        if (this.data.col) ret.col = this.data.col;
        if (this.data.doc) ret.doc = this.data.doc;
        if (this.data.v) ret.v = this.data.v;
        return ret;
    }

    isIntern() {
        if (this.data.col && this.data.col.charAt(0) === '_')
            return true;
        return false;
    }

    isSocket() {
        if (this.data.col && this.data.col === '_socket')
            return true;
        return false;
    }

    private _hash: string;
    get hash() {
        if (!this._hash)
            this._hash = hash(this.data);
        return this._hash;
    }
}


export function changeEventfromJSON(data) {
    return new RxChangeEvent(data);
}

export function changeEventfromPouchChange(changeDoc, collection) {
    let op = changeDoc._rev.startsWith('1-') ? 'INSERT' : 'UPDATE';
    if (changeDoc._deleted) op = 'REMOVE';

    // decompress / primarySwap
    changeDoc = collection._handleFromPouch(changeDoc);

    const data = {
        op,
        t: new Date().getTime(),
        db: 'remote',
        col: collection.name,
        it: collection.database.token,
        doc: changeDoc[collection.schema.primaryPath],
        v: changeDoc
    };
    return new RxChangeEvent(data);
}

export function createChangeEvent(
    op: string,
    database: RxDatabase,
    collection?: RxCollection,
    doc?,
    value?,
    isLocal = false
) {
    const data = {
        col: null,
        doc: null,
        v: null,
        op: op,
        t: new Date().getTime(),
        db: database.name,
        it: database.token,
        isLocal
    };
    if (collection) data.col = collection.name;
    if (doc) data.doc = doc.primary;
    if (value) data.v = value;
    return new RxChangeEvent(data);
}


export function isInstanceOf(obj) {
    return obj instanceof RxChangeEvent;
}