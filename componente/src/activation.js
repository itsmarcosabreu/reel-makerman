import { assertAttributes, assertEmptyElement, createMarkupSurfaceFacet, textAttribute } from "@hypit/hypit/markup";
import { canonicalize, sameType } from "@hypit/hypit/protocol";
import { sealGraphFragment } from "@hypit/hypit/author";
import { createAdmissionPackageFacet } from "@hypit/hypit/admission";
import { createProducerPackageFacet } from "@hypit/hypit/producer";
import { compositionTypes } from "@hypit/composition";
import { timelineTypes } from "@hypit/timeline";
import { spatialTypes } from "@hypit/spatial";
import { resolveTemporalContext, temporalContextAttributeVocabulary } from "@hypit/temporal/markup";
import { renderScenes } from "./scenes.js";

const module = { name: "@reel-makerman/cenas", version: "1" };
const optionsType = { module, name: "ScenesOptions" };
const producer = { module, name: "compose" };
const inputs = [
  { name: "timeline", type: timelineTypes.timeline }, { name: "within", type: spatialTypes.frame },
  { name: "options", type: optionsType },
];
export const manifest = { format: "hypit.module@1", ...module,
  dependencies: [compositionTypes.visualTrack, timelineTypes.timeline, spatialTypes.frame].map(type => ({ module: type.module })),
  types: [{ name: optionsType.name }], capabilities: [],
  producers: [{ name: producer.name, inputs, outputs: [{ name: "visual", type: compositionTypes.visualTrack }], needs: [] }],
};
const fragment = sealGraphFragment({ inputs, operations: [{ id: "compose", producer,
  inputs: Object.fromEntries(inputs.map(input => [input.name, { kind: "fragment-input", name: input.name }])),
  result: { kind: "output", name: "visual" } }],
  exports: [{ name: "visual", type: compositionTypes.visualTrack, root: { kind: "fragment-operation", operation: "compose" } }],
});
const inline = record => {
  if (record?.value.kind !== "inline") throw new Error("Scenes inputs must be inline values.");
  return record.value.value;
};
const component = { producers: [{ producer, handler: ({ inputs }) => ({ needs: {}, outputs: {
  visual: { kind: "inline", value: canonicalize(renderScenes(inline(inputs.timeline), inline(inputs.within), inline(inputs.options))) },
} }) }] };
export const decodeSurface = ({ element, resolveReference }) => {
  assertAttributes(element, ["id", "timeline", "within", "bg-z", "fg-z", "spec"]);
  assertEmptyElement(element);
  const id = textAttribute(element, "id");
  const raw = element.attributes.within;
  if (typeof raw !== "object" || raw.kind !== "reference") throw new Error("within must be a reference.");
  const within = resolveReference(raw.path);
  if (within === undefined || !sameType(spatialTypes.frame, within.type)) throw new Error("within has the wrong type.");
  const context = resolveTemporalContext({ element, resolveReference });
  const spec = JSON.parse(Buffer.from(textAttribute(element, "spec"), "base64").toString("utf8"));
  const options = { id, bgZ: Number(textAttribute(element, "bg-z")), fgZ: Number(textAttribute(element, "fg-z")), spec };
  return { records: [{ id: `${id}.options`, type: optionsType, value: { kind: "inline", value: canonicalize(options) }, range: element.range }],
    fragments: [fragment],
    components: [{ id, fragment: fragment.id,
      inputs: { timeline: context.timeline.ref, within: within.ref, options: { kind: "record", id: `${id}.options` } },
      outputs: { visual: `${id}.visual` }, range: element.range }],
    exports: [`${id}.visual`] };
};
const declaration = { name: "cenas", tag: "Cenas", mode: "structured",
  outputs: [compositionTypes.visualTrack, optionsType],
  vocabulary: { summary: "Capitulos claro/escuro do reel com titulos, cartoes de demonstracao e aneis do rosto (fundos abaixo do rosto, primeiro plano acima).",
    attributes: [
      ...["id", "bg-z", "fg-z", "spec"].map(name => ({ name, kind: "literal", required: true, summary: name })),
      ...temporalContextAttributeVocabulary,
      { name: "within", kind: "reference", required: true, accepts: [spatialTypes.frame], summary: "Frame que cobre o Canvas." },
    ], ports: [{ name: "visual", type: compositionTypes.visualTrack, summary: "As cenas." }],
    example: '<rm:Cenas id="cenas" timeline={program.timeline} within={full} bg-z="5" fg-z="30" spec="BASE64"/>',
  },
};
export const hypitPackage = { format: "hypit.package@1", modules: [{ manifest }],
  facets: [createProducerPackageFacet(component), createAdmissionPackageFacet(component),
    createMarkupSurfaceFacet({ module, declaration, handler: decodeSurface })] };
export default hypitPackage;
