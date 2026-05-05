export const DiffView = ({ originalAi, editableAi }: any) => {
    const isSummaryChanged =
        originalAi.reasoning !== editableAi.reasoning;

    const isEvidenceChanged =
        JSON.stringify(originalAi.requiredEvidence?.types) !==
        JSON.stringify(editableAi.requiredEvidence?.types);

    const isTemplatesChanged =
        JSON.stringify(originalAi.templates) !==
        JSON.stringify(editableAi.templates);

    return (
        <div className="space-y-6">

            {/* 🔹 AI SUMMARY */}
            {isSummaryChanged && (
                <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">AI Summary</h3>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500 mb-1">Original</p>
                            <div className="bg-gray-100 p-2 rounded">
                                {originalAi.reasoning}
                            </div>
                        </div>

                        <div>
                            <p className="text-blue-500 mb-1">Updated</p>
                            <div className="bg-yellow-100 p-2 rounded">
                                {editableAi.reasoning}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 🔹 EVIDENCE */}
            {isEvidenceChanged && (
                <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Evidence</h3>

                    <div className="grid grid-cols-2 gap-4">

                        {/* ORIGINAL */}
                        <div>
                            <p className="text-gray-500 mb-2 text-sm">Original</p>
                            <div className="flex flex-wrap gap-2">
                                {originalAi.requiredEvidence.types.map((t: string) => (
                                    <span key={t} className="bg-gray-100 px-2 py-1 text-xs rounded">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* UPDATED */}
                        <div>
                            <p className="text-blue-500 mb-2 text-sm">Updated</p>
                            <div className="flex flex-wrap gap-2">
                                {editableAi.requiredEvidence.types.map((t: string) => {
                                    const isNew = !originalAi.requiredEvidence.types.includes(t);

                                    return (
                                        <span
                                            key={t}
                                            className={`px-2 py-1 text-xs rounded ${isNew
                                                ? "bg-green-100 text-green-700"
                                                : "bg-gray-100"
                                                }`}
                                        >
                                            {t}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 🔹 TEMPLATES */}
            {/* {isTemplatesChanged && (
                <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Templates</h3>

                    <div className="grid grid-cols-2 gap-4 text-sm">

                        ORIGINAL
                        <div>
                            <p className="text-gray-500 mb-2">Original</p>
                            {originalAi.templates.map((t: any, i: number) => (
                                <div key={i} className="mb-3">
                                    <p className="font-medium">{t.name}</p>
                                </div>
                            ))}
                        </div>

                        UPDATED
                        <div>
                            <p className="text-blue-500 mb-2">Updated</p>
                            {editableAi.templates.map((t: any, i: number) => {
                                const original = originalAi.templates?.[i];
                                const changed =
                                    JSON.stringify(original) !== JSON.stringify(t);

                                return (
                                    <div
                                        key={i}
                                        className={`mb-3 ${changed ? "bg-yellow-100 p-1 rounded" : ""
                                            }`}
                                    >
                                        <p className="font-medium">{t.name}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )} */}
            {/* 🔹 TEMPLATES (WITH STRUCTURE DIFF) */}
            {isTemplatesChanged && (
                <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Templates</h3>

                    {editableAi.templates.map((template: any, index: number) => {
                        const original = originalAi.templates?.[index] || {};

                        const isTemplateChanged =
                            JSON.stringify(original) !== JSON.stringify(template);

                        // 🔥 MERGE ALL KEYS (important for diff)
                        const allKeys = new Set([
                            ...Object.keys(original.structure || {}),
                            ...Object.keys(template.structure || {}),
                        ]);

                        return (
                            <div
                                key={index}
                                className={`mb-5 border rounded p-3 ${isTemplateChanged ? "border-yellow-300 bg-yellow-50" : ""
                                    }`}
                            >
                                <p className="font-medium mb-2">{template.name}</p>

                                <div className="grid grid-cols-2 gap-4 text-sm">

                                    {/* 🔹 ORIGINAL */}
                                    <div>
                                        <p className="text-gray-500 mb-2">Original</p>

                                        {Array.from(allKeys).map((key: any) => (
                                            <div key={key} className="text-xs py-1">
                                                <b>{key}</b>: {original.structure?.[key] || "-"}
                                            </div>
                                        ))}
                                    </div>

                                    {/* 🔹 UPDATED */}
                                    <div>
                                        <p className="text-blue-500 mb-2">Updated</p>

                                        {Array.from(allKeys).map((key: any) => {
                                            const originalVal = original.structure?.[key];
                                            const newVal = template.structure?.[key];

                                            const isAdded = !originalVal && newVal;
                                            const isRemoved = originalVal && !newVal;
                                            const isChanged =
                                                originalVal && newVal && originalVal !== newVal;

                                            return (
                                                <div
                                                    key={key}
                                                    className={`text-xs py-1 px-2 rounded ${isAdded
                                                            ? "bg-green-100 text-green-700"
                                                            : isRemoved
                                                                ? "bg-red-100 text-red-700"
                                                                : isChanged
                                                                    ? "bg-yellow-100"
                                                                    : ""
                                                        }`}
                                                >
                                                    <b>{key}</b>: {newVal || "-"}
                                                    {isAdded && " (+ added)"}
                                                    {isRemoved && " (- removed)"}
                                                    {isChanged && " (modified)"}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

        </div>
    );
};