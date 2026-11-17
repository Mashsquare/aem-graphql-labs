import type { ReactNode } from "react";
import { todo } from "@/lib/todo";
import type { ModelComponentProps } from "./types";

/**
 * Task 3 — render one node of the page model, and (recursively) everything below it.
 *
 *  1. type = model[":type"]; `mapped = mapping.get(type)`.
 *  2. props for the component = every property of the model whose name does NOT start with ":" (so no :type,
 *     :items, :itemsOrder, :path), plus  cqPath: model[":path"]  and  isInEditor.
 *  3. A node with `:items` is a container. Its children (use childrenOf from ./model) are rendered as
 *         <div className={model.gridClassNames}>
 *           <div className={model.columnClassNames?.[key]}> <ModelComponent model={child} … /> </div>   per child
 *         </div>
 *     If the container type is mapped, call the mapped component instead, with the rendered grid as its `children`.
 *  4. A leaf is rendered as <Component {...props} />.
 *  5. Unmapped type:  container -> still renders its children (step 3);  leaf -> nothing on Publish, and in the
 *     editor  <div className="aem-unmapped" data-cq-data-path={cqPath}>Unmapped component: {type}</div>
 *  6. In the editor (isInEditor) the author's overlay finds components by `data-cq-data-path`:
 *       - a mapped leaf is wrapped:   <div data-cq-data-path={cqPath}> … </div>
 *       - if its editConfig.isEmpty(props) is true, render the placeholder instead of the component:
 *           <div className="cq-placeholder" data-emptytext={editConfig.emptyLabel ?? "Component"}></div>   (inside the wrapper)
 *       - a default container puts data-cq-data-path on its grid <div>
 *     Outside the editor none of this exists: no wrappers, no attributes, no placeholders.
 */
export function ModelComponent(props: ModelComponentProps): ReactNode {
  void props;
  return todo("implement ModelComponent in ModelComponent.tsx");
}
