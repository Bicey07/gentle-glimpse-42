import assert from "node:assert/strict";
import test from "node:test";
import {
  validateFile,
  documentSchema,
  filterDocuments,
  errorMessage,
  type RoomDocument,
} from "../src/lib/workspace/model";
test("files accept ordinary documents and reject empty, oversize and active HTML/SVG", () => {
  assert.equal(
    validateFile({ name: "稿件.docx", size: 100, type: "" }),
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  );
  assert.equal(validateFile({ name: "照片.JPG", size: 100, type: "image/jpeg" }), "image/jpeg");
  for (const file of [
    { name: "empty.txt", size: 0, type: "" },
    { name: "large.pdf", size: 21 * 1024 * 1024, type: "" },
    { name: "a.svg", size: 100, type: "image/svg+xml" },
    { name: "a.html", size: 100, type: "text/html" },
    { name: "a.jpg", size: 100, type: "text/html" },
  ])
    assert.throws(() => validateFile(file));
});
test("document validation and search preserve content while validating names and versions", () => {
  const base = {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    room_id: "room-test",
    title: "  晚风  ",
    body: "想写的一句话",
    category: "writing",
    status: "draft",
    version: 0,
  };
  assert.equal(documentSchema.parse(base).title, "晚风");
  assert.throws(() => documentSchema.parse({ ...base, title: "  " }));
  assert.throws(() => documentSchema.parse({ ...base, version: -1 }));
  const docs = [documentSchema.parse(base)] as RoomDocument[];
  assert.equal(filterDocuments(docs, "一句话", "all").length, 1);
  assert.equal(filterDocuments(docs, "晚风", "film").length, 0);
  assert.match(errorMessage({ code: "40001" }), /文字还在/);
});
