import {test} from 'json-predicate';

class JSONPatchRules {
    constructor(rules) {
        this.rules = rules;
    }

    check(json_patch) {
        if(!Array.isArray(json_patch))
            throw new Error("json_patch parameter must be an array");
        
        return json_patch.every((item) => this.checkOperation(item));
    }

    checkOperation(item) {

    }

}

export default JSONPatchRules;