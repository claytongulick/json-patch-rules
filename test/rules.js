let JSONPatchRules = require('../index');
let assert = require('assert');

const json_patch = [
    { path: "/user/email", op: "replace", value: "zaphod@beeblebrox.com"},
    { path: "/user/friends/0/bestie", op: "replace", value: true},
    { path: "/user/role", op: "add", value: "god"}
];
describe("Rules tests",
    () => {
        it("Finds path rules correctly", () => {
            let rules = [
                { path: "/user/email" }
            ];
            let rules_check = new JSONPatchRules(rules);
            let found_rules = rules_check.findRules(json_patch[0]);
            assert.equal(found_rules.length, 1);

        });

        it("Matches regex paths", () => {
            let rules = [
                { path: "^/user/friends/.+/bestie"}
            ];
            let rules_check = new JSONPatchRules(rules);
            let found_rules = rules_check.findRules(json_patch[1]);
            assert.equal(found_rules.length, 1);

        });

        it("Finds path + operation combinations", () => {
            let rules = [
                { path: "^/user/friends/.+/bestie", op: "replace"}
            ];
            let rules_check = new JSONPatchRules(rules);
            let found_rules = rules_check.findRules(json_patch[1]);
            assert.equal(found_rules.length, 1);
        });

        it("Finds operation only rules", () => {
            let rules = [
                { op: "replace"}
            ];
            let rules_check = new JSONPatchRules(rules);
            let found_rules = rules_check.findRules(json_patch[1]);
            assert.equal(found_rules.length, 1);
        });

        it("Matches simple regex value tests", () => {
            let rules = [
                { path: "/user/email", op: "replace", value: "[^@]+@[^\.]+\..+"}
            ];
            let rules_check = new JSONPatchRules(rules);
            let found_rules = rules_check.findRules(json_patch[0]);
            assert.equal(found_rules.length, 1);

        });

        it("Matches json predicate value tests", () => {
            let rules = [
                { path: "/user/email", op: "replace", value: "[^@]+@[^\.]+\..+", test: 
                    {op: "and", apply: [
                        {op:"contains", path: "/value", value:"zaphod"},
                        {op:"contains", path: "/value", value:"com"},
                    ]}
                }
            ];
            let rules_check = new JSONPatchRules(rules);
            let found_rules = rules_check.findRules(json_patch[0]);
            assert.equal(found_rules.length, 1);

        });

        it("Correctly returns true/false based on whitelist mode", () => {
            let rules = [
                { path: "/user/email", op: "replace", value: "[^@]+@[^\.]+\..+"},
                { path: "^/user/friends/.+/bestie", op: "replace" }
            ];
            let rules_check = new JSONPatchRules(rules, {mode: 'whitelist'});
            let valid = rules_check.check(json_patch);
            assert.equal(valid, false);

            rules = [
                { path: "/user/email", op: "replace", value: "[^@]+@[^\.]+\..+"},
                { path: "^/user/friends/.+/bestie", op: "replace" },
                { path: "/user/role", op: "add", value: "god"}
            ]
            
            rules_check = new JSONPatchRules(rules, {mode: 'whitelist'});
            valid = rules_check.check(json_patch);
            assert.equal(valid, true);

        });

        it("Correctly returns true/false based on blacklist mode", () => {
            let rules = [
                { path: "/user/email", op: "replace", value: "[^@]+@[^\.]+\..+"},
                { path: "^/user/friends/.+/bestie", op: "replace" }
            ];
            let rules_check = new JSONPatchRules(rules, {mode: 'blacklist'});
            let valid = rules_check.check(json_patch);
            assert.equal(valid, false);

            rules = [
                {path: "/user/avatar", op: "replace"}
            ];
            rules_check = new JSONPatchRules(rules, {mode: 'blacklist'});
            valid = rules_check.check(json_patch);
            assert.equal(valid, true);

        });
    }
);