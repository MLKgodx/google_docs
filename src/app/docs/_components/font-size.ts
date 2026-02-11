import { Extension } from "@tiptap/core"

export const FontSize = Extension.create({
  name: "fontSize",

  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.fontSize || null,
            renderHTML: (attributes: Record<string, unknown>) => {
              if (!attributes.fontSize) return {}
              return { style: `font-size: ${attributes.fontSize as string}` }
            },
          },
        },
      },
    ]
  },
})
