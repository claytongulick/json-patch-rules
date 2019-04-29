import {test} from 'json-predicate';

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
        if(!rules || (rules.length == 0))
        {
            //we didn't find a rule. depending on whether we're in whitelist or blacklist mode, this might be permissable
            if(this.options.mode == 'whitelist')
                return false;
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

        if(rule.test) {
            //if this is an array, it's a json predicate set
            if(Array.isArray(rule.test)) {
                let test_match = test(item, rules.test);
                if(!test_match)
                    return false;
            }
            else {
                let regex = new RegExp(rule.test);
                let test_match = regex.test(item.value);
                if(!test_match)
                    return false;
            }
        }

        return true;
    }

}

export default JSONPatchRules;