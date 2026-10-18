import { areaStudyValue, subjectStudyValue } from "@/lib/sessions";
import { AREAS, subjectsOf } from "@/lib/syllabus";
import type { TopicRecord } from "@/lib/topics";

// Opções do seletor "o que estudar": cada área (ou matéria, em Natureza e Humanas) inteira e os tópicos dela.
export function StudyOptions({ topics }: { topics: readonly TopicRecord[] }) {
  const topicOptions = (list: TopicRecord[]) =>
    list.map((topic) => (
      <option key={topic.id} value={topic.id}>
        {topic.name}
      </option>
    ));

  return AREAS.map((area) => {
    const subjects = subjectsOf(area.id);
    const inArea = topics.filter((topic) => topic.areaId === area.id);
    return [
      <optgroup key={area.id} label={area.name}>
        <option value={areaStudyValue(area.id)}>{area.name} (geral)</option>
        {topicOptions(inArea.filter((topic) => !topic.subjectId))}
      </optgroup>,
      ...subjects.map((subject) => (
        <optgroup key={subject.id} label={subject.name}>
          <option value={subjectStudyValue(subject.id)}>{subject.name} (geral)</option>
          {topicOptions(inArea.filter((topic) => topic.subjectId === subject.id))}
        </optgroup>
      )),
    ];
  });
}
