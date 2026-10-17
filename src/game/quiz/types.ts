// Câu hỏi khảo hạch. Đáp án đúng chỉ tồn tại trên máy chủ: client nhận id phương án dạng băm, không đoán được.
// QUY TẮC: chỉ THÊM câu mới, không sửa/xoá id cũ — engine bốc câu theo seed, đổi ngân hàng sẽ làm kiếp đang dở lệch nhịp.

export type Question = {
  id: string;
  level: 1 | 2 | 3;
  prompt: string;
  options: { id: string; text: string }[];
  answer: string; // id phương án đúng
  explain: string;
};

// FNV-1a → chuỗi base36 ngắn
function hash(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/** q(id, cấp độ, đề, [đáp án đúng, sai, sai, sai], giảng giải) */
export function q(id: string, level: 1 | 2 | 3, prompt: string, [right, ...wrong]: string[], explain: string): Question {
  const options = [right, ...wrong].map((text) => ({ id: hash(`${id}|${text}`), text }));
  return { id, level, prompt, options, answer: options[0].id, explain };
}
