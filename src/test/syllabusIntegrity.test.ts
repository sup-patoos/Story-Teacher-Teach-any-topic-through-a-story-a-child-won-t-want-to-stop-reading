import { describe, it, expect } from 'vitest';
import syllabus from '../data/syllabus.json';

describe('Syllabus Data Integrity', () => {
  it('has a valid root schema with Classes 7, 8, and 9', () => {
    expect(syllabus).toBeDefined();
    expect(Array.isArray(syllabus.classes)).toBe(true);
    expect(syllabus.classes.length).toBeGreaterThanOrEqual(3);

    const classNums = syllabus.classes.map(c => c.class);
    expect(classNums).toContain(7);
    expect(classNums).toContain(8);
    expect(classNums).toContain(9);
  });

  it('guarantees unique IDs across all classes, subjects, branches, chapters, and subtopics', () => {
    const allIds: string[] = [];

    syllabus.classes.forEach(cls => {
      cls.subjects.forEach(subj => {
        allIds.push(subj.id);

        if (subj.chapters) {
          subj.chapters.forEach(ch => {
            allIds.push(ch.id);
            ch.subtopics.forEach(sub => allIds.push(sub.id));
          });
        }

        if (subj.branches) {
          subj.branches.forEach(branch => {
            allIds.push(branch.id);
            branch.chapters.forEach(ch => {
              allIds.push(ch.id);
              ch.subtopics.forEach(sub => allIds.push(sub.id));
            });
          });
        }
      });
    });

    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });

  it('ensures every chapter has subtopics, and each subtopic has a title and videoId field', () => {
    let totalChaptersChecked = 0;
    let totalSubtopicsChecked = 0;

    syllabus.classes.forEach(cls => {
      cls.subjects.forEach(subj => {
        const chaptersList = subj.chapters || (subj.branches ? subj.branches.flatMap(b => b.chapters) : []);

        expect(chaptersList.length).toBeGreaterThan(0);

        chaptersList.forEach(chapter => {
          totalChaptersChecked++;
          expect(Array.isArray(chapter.subtopics)).toBe(true);
          expect(chapter.subtopics.length).toBeGreaterThan(0);

          chapter.subtopics.forEach(subtopic => {
            totalSubtopicsChecked++;
            // id check
            expect(typeof subtopic.id).toBe('string');
            expect(subtopic.id.trim().length).toBeGreaterThan(0);

            // title check
            expect(typeof subtopic.title).toBe('string');
            expect(subtopic.title.trim().length).toBeGreaterThan(0);

            // videoId field check (must exist, can be a string or null)
            expect('videoId' in subtopic).toBe(true);
            const isValidVideo = typeof subtopic.videoId === 'string' || subtopic.videoId === null;
            expect(isValidVideo).toBe(true);
          });
        });
      });
    });

    expect(totalChaptersChecked).toBeGreaterThan(20);
    expect(totalSubtopicsChecked).toBeGreaterThan(60);
  });
});
