import { describe, expect, it } from 'vitest';

import { skeletonKind } from './skeleton-kind';

const U = '019b88af-6d13-772e-9f3d-2fb53828537c';

describe('skeletonKind', () => {
  it('role homes are dashboards', () => {
    expect(skeletonKind('/rectorat/institution/abc')).toBe('dashboard');
    expect(skeletonKind(`/rectorat/institution/${U}/`)).toBe('dashboard');
    expect(skeletonKind(`/student/person/master/individual/${U}`)).toBe('dashboard');
    expect(skeletonKind(`/lecturer/person/master/individual/${U}/show`)).toBe('dashboard');
    expect(skeletonKind(`/course-department/institution/master/unit/${U}`)).toBe('dashboard');
  });
  it('directories are lists', () => {
    expect(skeletonKind(`/rectorat/institution/${U}/student`)).toBe('list');
    expect(skeletonKind('/lecturer/academic/campaign/transaction/teach')).toBe('list');
    expect(skeletonKind('/course-department/academic/course/master/course?page=2')).toBe('list');
  });
  it('forms and per-record pages are detail', () => {
    expect(skeletonKind('/course-department/academic/course/master/course/create')).toBe('detail');
    expect(skeletonKind(`/lecturer/academic/campaign/transaction/teach/${U}/attendance`)).toBe('detail');
    expect(skeletonKind(`/course-department/academic/course/master/course/${U}`)).toBe('detail');
  });
});
