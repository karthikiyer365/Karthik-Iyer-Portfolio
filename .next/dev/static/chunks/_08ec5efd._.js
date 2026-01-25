(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/lib/editorState.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "editorReducer",
    ()=>editorReducer,
    "initialEditorState",
    ()=>initialEditorState
]);
const initialEditorState = {
    openFiles: [],
    activeFile: null,
    expandedFolders: [
        "portfolio"
    ]
};
function editorReducer(state, action) {
    switch(action.type){
        case "OPEN_FILE":
            {
                const { path, name } = action.payload;
                const isAlreadyOpen = state.openFiles.some((f)=>f.path === path);
                if (isAlreadyOpen) {
                    return {
                        ...state,
                        activeFile: path
                    };
                }
                return {
                    ...state,
                    openFiles: [
                        ...state.openFiles,
                        {
                            path,
                            name
                        }
                    ],
                    activeFile: path
                };
            }
        case "CLOSE_FILE":
            {
                const path = action.payload;
                const newOpenFiles = state.openFiles.filter((f)=>f.path !== path);
                let newActiveFile = state.activeFile;
                if (state.activeFile === path) {
                    const closedIndex = state.openFiles.findIndex((f)=>f.path === path);
                    if (newOpenFiles.length > 0) {
                        const newIndex = Math.min(closedIndex, newOpenFiles.length - 1);
                        newActiveFile = newOpenFiles[newIndex].path;
                    } else {
                        newActiveFile = null;
                    }
                }
                return {
                    ...state,
                    openFiles: newOpenFiles,
                    activeFile: newActiveFile
                };
            }
        case "SET_ACTIVE":
            {
                return {
                    ...state,
                    activeFile: action.payload
                };
            }
        case "TOGGLE_FOLDER":
            {
                const folder = action.payload;
                const isExpanded = state.expandedFolders.includes(folder);
                return {
                    ...state,
                    expandedFolders: isExpanded ? state.expandedFolders.filter((f)=>f !== folder) : [
                        ...state.expandedFolders,
                        folder
                    ]
                };
            }
        default:
            return state;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/providers.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EditorProvider",
    ()=>EditorProvider,
    "PersonaProvider",
    ()=>PersonaProvider,
    "Providers",
    ()=>Providers,
    "useEditor",
    ()=>useEditor,
    "usePersona",
    ()=>usePersona
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editorState$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/editorState.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature(), _s3 = __turbopack_context__.k.signature();
"use client";
;
;
const EditorContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(null);
function EditorProvider({ children }) {
    _s();
    const [state, dispatch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReducer"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editorState$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["editorReducer"], __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$editorState$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["initialEditorState"]);
    const openFile = (path, name)=>{
        dispatch({
            type: "OPEN_FILE",
            payload: {
                path,
                name
            }
        });
    };
    const closeFile = (path)=>{
        dispatch({
            type: "CLOSE_FILE",
            payload: path
        });
    };
    const setActiveFile = (path)=>{
        dispatch({
            type: "SET_ACTIVE",
            payload: path
        });
    };
    const toggleFolder = (folder)=>{
        dispatch({
            type: "TOGGLE_FOLDER",
            payload: folder
        });
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(EditorContext.Provider, {
        value: {
            state,
            dispatch,
            openFile,
            closeFile,
            setActiveFile,
            toggleFolder
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/app/providers.tsx",
        lineNumber: 38,
        columnNumber: 5
    }, this);
}
_s(EditorProvider, "MuF19Wbn4VqErpVTbTW1qDz/n4k=");
_c = EditorProvider;
function useEditor() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(EditorContext);
    if (!context) {
        throw new Error("useEditor must be used within an EditorProvider");
    }
    return context;
}
_s1(useEditor, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
const PersonaContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(null);
function PersonaProvider({ children }) {
    _s2();
    const [persona, setPersona] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useState("tech-lead");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PersonaContext.Provider, {
        value: {
            persona,
            setPersona
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/app/providers.tsx",
        lineNumber: 73,
        columnNumber: 5
    }, this);
}
_s2(PersonaProvider, "+WYBqilTYoyaz0fKqVeRw1di1/s=");
_c1 = PersonaProvider;
function usePersona() {
    _s3();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(PersonaContext);
    if (!context) {
        throw new Error("usePersona must be used within a PersonaProvider");
    }
    return context;
}
_s3(usePersona, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
function Providers({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(EditorProvider, {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PersonaProvider, {
            children: children
        }, void 0, false, {
            fileName: "[project]/app/providers.tsx",
            lineNumber: 91,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/providers.tsx",
        lineNumber: 90,
        columnNumber: 5
    }, this);
}
_c2 = Providers;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "EditorProvider");
__turbopack_context__.k.register(_c1, "PersonaProvider");
__turbopack_context__.k.register(_c2, "Providers");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_08ec5efd._.js.map