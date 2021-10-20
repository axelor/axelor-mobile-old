
export default {
  Contact: {
    model: 'contacts',
    fields: ['fullName', 'firstName', 'lastName'],
    mapFields: {
      firstName: 'first_name',
      lastName: 'last_name',
      fullName: 'full_name',
    },
  },
  Company: {
    model: 'company',
    fields: ['id', 'title'],
    mapFields: {
      name: 'title',
    },
  },
};
