import { EditorState, EditorAction } from "@/types/editor";

export const initialEditorState: EditorState = {
  openFiles: [],
  activeFile: null,
  expandedFolders: ["portfolio"],
};

export function editorReducer(
  state: EditorState,
  action: EditorAction
): EditorState {
  switch (action.type) {
    case "OPEN_FILE": {
      const { path, name } = action.payload;
      const isAlreadyOpen = state.openFiles.some((f) => f.path === path);
      
      if (isAlreadyOpen) {
        return { ...state, activeFile: path };
      }
      
      return {
        ...state,
        openFiles: [...state.openFiles, { path, name }],
        activeFile: path,
      };
    }
    
    case "CLOSE_FILE": {
      const path = action.payload;
      const newOpenFiles = state.openFiles.filter((f) => f.path !== path);
      
      let newActiveFile = state.activeFile;
      if (state.activeFile === path) {
        const closedIndex = state.openFiles.findIndex((f) => f.path === path);
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
        activeFile: newActiveFile,
      };
    }
    
    case "SET_ACTIVE": {
      return { ...state, activeFile: action.payload };
    }
    
    case "TOGGLE_FOLDER": {
      const folder = action.payload;
      const isExpanded = state.expandedFolders.includes(folder);
      
      return {
        ...state,
        expandedFolders: isExpanded
          ? state.expandedFolders.filter((f) => f !== folder)
          : [...state.expandedFolders, folder],
      };
    }
    
    default:
      return state;
  }
}
