const jsonPredicate = require('json-predicate');
const test = jsonPredicate.test;

class JSONPatchRules {
    constructor(rules, options) {
        this.options = Object.assign({
            mode: 'whitelist'
        },options);
        this.rules = rules;
    }

    check(json_patch) {
        if(!Array.isArray(json_patch))
            throw new Error("json_patch parameter must be an array");
        
        return json_patch.every((item) => this.checkOperation(item));
    }

    checkOperation(item) {
        let rules = this.findRules(item);
        if(this.options.mode == "blacklist") {
            if(!rules)
                return true;

            if(rules.length == 0)
                return true;

            if(rules.length > 0)
                return false;

        }

        if(this.options.mode == "whitelist") {
            if(!rules)
                return false;

            if(rules.length == 0)
                return false;

            if(rules.length > 0)
                return true;

        }

    }

    findRules(item) {
        return this.rules.filter(
            (rule) => {
                return this.ruleMatches(item, rule);
            }
        );
    }

    ruleMatches(item, rule) {

        if(rule.path) {
            let path = rule.path;
            //if this is a regex
            if(path.indexOf('^/') == 0) {
                let regex = new RegExp(path);
                let match = regex.test(item.path);
                if(!match)
                    return false;
            }
            else if(path != item.path) {
                return false;
            }
        }

        if(rule.op) {
            if(Array.isArray(rule.op)) {
                let op_match = rule.op.includes(item.op)
                if(!op_match)
                    return false;
            }
            else {
                if(!rule.op === item.op)
                    return false;
            }
        }

        if(rule.value) {
            if (typeof rule.value == 'string') {
                let regex = new RegExp(rule.value);
                let test_match = regex.test(item.value);
                if (!test_match)
                    return false;
            }
            else {
                let test_match = (rule.value === item.value);
                if(!test_match)
                    return false;
            }
        }

        if(rule.test) {
            let valid = jsonPredicate.validatePredicate(rule.test);
            if(!valid)
                throw new Error("Invalid JSON Predicate");
                
            //if this is an array, it's a json predicate set
            let test_match = test(item, rule.test);
            if(!test_match)
                return false;
        }

        return true;
    }

}

module.exports = JSONPatchRules;