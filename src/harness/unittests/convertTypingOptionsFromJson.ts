/// <reference path="..\harness.ts" />
/// <reference path="..\..\compiler\commandLineParser.ts" />

namespace ts {
    describe("convertTypingOptionsFromJson", () => {
        function assertTypingOptions(json: any, configFileName: string, expectedResult: { typingOptions: TypingOptions, errors: Diagnostic[] }) {
            assertTypingOptionsWithJson(json, configFileName, expectedResult);
            assertTypingOptionsWithJsonNode(json, configFileName, expectedResult);
        }

        function assertTypingOptionsWithJson(json: any, configFileName: string, expectedResult: { typingOptions: TypingOptions, errors: Diagnostic[] }) {
            const { options: actualTypingOptions, errors: actualErrors } = convertTypingOptionsFromJson(json["typingOptions"], "/apath/", configFileName);
            const parsedTypingOptions = JSON.stringify(actualTypingOptions);
            const expectedTypingOptions = JSON.stringify(expectedResult.typingOptions);
            assert.equal(parsedTypingOptions, expectedTypingOptions);

            const expectedErrors = expectedResult.errors;
            assert.isTrue(expectedResult.errors.length === actualErrors.length, `Expected error: ${JSON.stringify(expectedResult.errors)}. Actual error: ${JSON.stringify(actualErrors)}.`);
            for (let i = 0; i < actualErrors.length; i++) {
                const actualError = actualErrors[i];
                const expectedError = expectedErrors[i];
                assert.equal(actualError.code, expectedError.code, `Expected error-code: ${JSON.stringify(expectedError.code)}. Actual error-code: ${JSON.stringify(actualError.code)}.`);
                assert.equal(actualError.category, expectedError.category, `Expected error-category: ${JSON.stringify(expectedError.category)}. Actual error-category: ${JSON.stringify(actualError.category)}.`);
            }
        }

        function assertTypingOptionsWithJsonNode(json: any, configFileName: string, expectedResult: { typingOptions: TypingOptions, errors: Diagnostic[] }) {
            const fileText = JSON.stringify(json);
            const { node, errors } = parseJsonText(configFileName, fileText);
            assert(!errors.length);
            assert(!!node);
            const host: ParseConfigHost = new Utils.MockParseConfigHost("/apath/", true, []);
            const { typingOptions: actualTypingOptions, errors: actualParseErrors } = parseJsonNodeConfigFileContent(node, host, "/apath/", /*existingOptions*/ undefined, configFileName);
            const parsedTypingOptions = JSON.stringify(actualTypingOptions);
            const expectedTypingOptions = JSON.stringify(expectedResult.typingOptions);
            assert.equal(parsedTypingOptions, expectedTypingOptions);

            const actualErrors = filter(actualParseErrors, error => error.code !== Diagnostics.No_inputs_were_found_in_config_file_0_Specified_include_paths_were_1_and_exclude_paths_were_2.code);
            const expectedErrors = expectedResult.errors;
            assert.isTrue(expectedResult.errors.length === actualErrors.length, `Expected error: ${JSON.stringify(expectedResult.errors)}. Actual error: ${JSON.stringify(actualErrors)}.`);
            for (let i = 0; i < actualErrors.length; i++) {
                const actualError = actualErrors[i];
                const expectedError = expectedErrors[i];
                assert.equal(actualError.code, expectedError.code, `Expected error-code: ${JSON.stringify(expectedError.code)}. Actual error-code: ${JSON.stringify(actualError.code)}.`);
                assert.equal(actualError.category, expectedError.category, `Expected error-category: ${JSON.stringify(expectedError.category)}. Actual error-category: ${JSON.stringify(actualError.category)}.`);
                assert(actualError.file);
                assert(actualError.start);
                assert(actualError.length);
            }
        }

        // tsconfig.json
        it("Convert correctly format tsconfig.json to typing-options ", () => {
            assertTypingOptions(
                {
                    "typingOptions":
                    {
                        "enableAutoDiscovery": true,
                        "include": ["0.d.ts", "1.d.ts"],
                        "exclude": ["0.js", "1.js"]
                    }
                },
                "tsconfig.json",
                {
                    typingOptions:
                    {
                        enableAutoDiscovery: true,
                        include: ["0.d.ts", "1.d.ts"],
                        exclude: ["0.js", "1.js"]
                    },
                    errors: <Diagnostic[]>[]
            });
        });

        it("Convert incorrect format tsconfig.json to typing-options ", () => {
            assertTypingOptions(
                {
                    "typingOptions":
                    {
                        "enableAutoDiscovy": true,
                    }
                }, "tsconfig.json",
                {
                    typingOptions:
                    {
                        enableAutoDiscovery: false,
                        include: [],
                        exclude: []
                    },
                    errors: [
                        {
                            category: Diagnostics.Unknown_typing_option_0.category,
                            code: Diagnostics.Unknown_typing_option_0.code,
                            file: undefined,
                            start: 0,
                            length: 0,
                            messageText: undefined
                        }
                    ]
                });
        });

        it("Convert default tsconfig.json to typing-options ", () => {
            assertTypingOptions({}, "tsconfig.json",
                {
                    typingOptions:
                    {
                        enableAutoDiscovery: false,
                        include: [],
                        exclude: []
                    },
                    errors: <Diagnostic[]>[]
                });
        });

        it("Convert tsconfig.json with only enableAutoDiscovery property to typing-options ", () => {
            assertTypingOptions(
                {
                    "typingOptions":
                    {
                        "enableAutoDiscovery": true
                    }
                }, "tsconfig.json",
                {
                    typingOptions:
                    {
                        enableAutoDiscovery: true,
                        include: [],
                        exclude: []
                    },
                    errors: <Diagnostic[]>[]
                });
        });

        // jsconfig.json
        it("Convert jsconfig.json to typing-options ", () => {
            assertTypingOptions(
                {
                    "typingOptions":
                    {
                        "enableAutoDiscovery": false,
                        "include": ["0.d.ts"],
                        "exclude": ["0.js"]
                    }
                }, "jsconfig.json",
                {
                    typingOptions:
                    {
                        enableAutoDiscovery: false,
                        include: ["0.d.ts"],
                        exclude: ["0.js"]
                    },
                    errors: <Diagnostic[]>[]
                });
        });

        it("Convert default jsconfig.json to typing-options ", () => {
            assertTypingOptions({ }, "jsconfig.json",
                {
                    typingOptions:
                    {
                        enableAutoDiscovery: true,
                        include: [],
                        exclude: []
                    },
                    errors: <Diagnostic[]>[]
                });
        });

        it("Convert incorrect format jsconfig.json to typing-options ", () => {
            assertTypingOptions(
                {
                    "typingOptions":
                    {
                        "enableAutoDiscovy": true,
                    }
                }, "jsconfig.json",
                {
                    typingOptions:
                    {
                        enableAutoDiscovery: true,
                        include: [],
                        exclude: []
                    },
                    errors: [
                        {
                            category: Diagnostics.Unknown_typing_option_0.category,
                            code: Diagnostics.Unknown_typing_option_0.code,
                            file: undefined,
                            start: 0,
                            length: 0,
                            messageText: undefined
                        }
                    ]
                });
        });

        it("Convert jsconfig.json with only enableAutoDiscovery property to typing-options ", () => {
            assertTypingOptions(
                {
                    "typingOptions":
                    {
                        "enableAutoDiscovery": false
                    }
                }, "jsconfig.json",
                {
                    typingOptions:
                    {
                        enableAutoDiscovery: false,
                        include: [],
                        exclude: []
                    },
                    errors: <Diagnostic[]>[]
                });
        });
    });
}
