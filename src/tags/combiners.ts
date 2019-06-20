import { TagCombiner } from '../interfaces';

export const keepFirst: TagCombiner = thisTag => thisTag;

export const keepN: (limit: number) => TagCombiner = (limit: number) => (
  thisTag,
  otherTag
) => {
  if (Array.isArray(thisTag) && thisTag.length >= limit) {
    return thisTag;
  }

  if (Array.isArray(thisTag) && Array.isArray(otherTag)) {
    return [...thisTag, ...otherTag].slice(0, limit);
  }

  if (Array.isArray(thisTag)) {
    return [...thisTag, otherTag];
  }

  if (Array.isArray(otherTag)) {
    return [thisTag, ...otherTag].slice(0, limit);
  }

  return [thisTag, otherTag];
};
