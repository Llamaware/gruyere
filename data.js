const DEFAULT_DATA = {
    administrator: {
        name: 'Admin',
        pw: 'secret',
        is_author: false,
        is_admin: true,
        private_snippet: 'My password is secret. Get it?',
        web_site: 'https://www.google.com/contact/',
    },
    onehalf: {
        name: 'onehalf',
        pw: 'virus.dos',
        is_author: true,
        is_admin: true,
        private_snippet: 'Dis is one half.',
        web_site: 'https://onehalf.dev/',
        color: 'purple',
        snippets: [
            'Why are you <i>still</i> using Windows 98?! What is wrong with you?! Stop buying computers from thrift stores, man!'
        ],
    },
    basil: {
        name: 'Basil',
        pw: 'catgirl',
        is_author: true,
        is_admin: false,
        private_snippet: 'Seems kinda unwise to connect myself to something that has so many security holes..',
        web_site: 'https://basil.cafe/',
        color: 'green',
        snippets: [
            'But wait! Don\'t breathe yet!'
        ],
    },
    cheddar: {
        name: 'Cheddar Mac',
        pw: 'orange',
        is_author: true,
        is_admin: false,
        private_snippet: 'My SSN is <a href="https://www.google.com/search?q=078-05-1120">078-05-1120</a>.',
        web_site: 'https://images.google.com/?q=cheddar+cheese',
        color: 'blue',
        snippets: [
            'Gruyere is the cheesiest application on the web.',
            'I wonder if there are any security holes in this....'
        ],
    },
    sardo: {
        name: 'Miss Sardo',
        pw: 'odras',
        is_author: true,
        is_admin: false,
        private_snippet: 'I hate my brother Romano.',
        web_site: 'https://www.google.com/search?q="pecorino+sardo"',
        color: 'red',
        snippets: [],
    },
    brie: {
        name: 'Brie',
        pw: 'briebrie',
        is_author: true,
        is_admin: false,
        private_snippet: 'I use the same password for all my accounts.',
        web_site: 'https://news.google.com/news/search?q=brie',
        color: 'red; text-decoration:underline',
        snippets: [
            'Brie is the queen of the cheeses<span style="color:red">!!!</span>'
        ],
    },
};

// Export the DEFAULT_DATA object if using modules
// export default DEFAULT_DATA;
const _db = DEFAULT_DATA;