module.exports = class MachineReadableFiles {
  data() {
    return {
      pagination: {
        data: "machineReadableFiles",
        size: 1,
        alias: "machineFile"
      },
      permalink: (data) => data.machineFile.path,
      excludeFromSitemap: true,
      eleventyExcludeFromCollections: true
    };
  }

  render(data) {
    return data.machineFile.content;
  }
};
