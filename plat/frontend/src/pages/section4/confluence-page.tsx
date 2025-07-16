import { useState, useEffect } from 'react';
import {
  AppLayout,
  ContentLayout,
  Header,
  Container,
  SideNavigation,
  HelpPanel,
  Spinner,
} from '@cloudscape-design/components';
import { SideNavigationProps } from '@cloudscape-design/components/side-navigation';

interface TocItem {
  id: string;
  level: number;
  text: string;
}

const ConfluencePage = () => {
  const [pageTree, setPageTree] = useState<SideNavigationProps.Item[]>([]);
  const [activeHref, setActiveHref] = useState<string>('');
  const [pageContent, setPageContent] = useState<string>('');
  const [toc, setToc] = useState<TocItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPageTree = async () => {
      try {
        const response = await fetch('http://localhost:8001/api/confluence/page-tree');
        const data = await response.json();
        setPageTree(data);
        // Select the first leaf node by default
        const firstPage = findFirstLeaf(data);
        if (firstPage) {
          setActiveHref(firstPage.href!);
        }
      } catch (error) {
        console.error('Error fetching page tree:', error);
      }
    };
    fetchPageTree();
  }, []);

  useEffect(() => {
    if (!activeHref) return;

    const fetchPageContent = async () => {
      setLoading(true);
      try {
        const pageId = activeHref.split('/').pop();
        const response = await fetch(`http://localhost:8001/api/confluence/page/${pageId}`);
        const data = await response.json();
        setPageContent(data.html_content);
        generateToc(data.html_content);
      } catch (error) {
        console.error('Error fetching page content:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPageContent();
  }, [activeHref]);

  const findFirstLeaf = (items: readonly SideNavigationProps.Item[]): SideNavigationProps.Link | null => {
    for (const item of items) {
      if (item.type === 'link') {
        return item;
      }
      if (item.type === 'section' && item.items) {
        const found = findFirstLeaf(item.items);
        if (found) return found;
      }
    }
    return null;
  };

  const generateToc = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3');
    const newToc: TocItem[] = Array.from(headings).map((h, i) => {
      const id = `toc-${i}`;
      h.id = id;
      return {
        id,
        level: parseInt(h.tagName.substring(1), 10),
        text: h.textContent || '',
      };
    });
    setToc(newToc);
    // Update page content with IDs for scrolling
    setPageContent(doc.body.innerHTML);
  };

  const handleFollow = (e: CustomEvent<SideNavigationProps.FollowDetail>) => {
    if (!e.detail.external) {
      e.preventDefault();
      setActiveHref(e.detail.href);
    }
  };

  const scrollToTocId = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <AppLayout
      navigation={
        <SideNavigation
          header={{ href: '#/', text: 'Confluence Pages' }}
          activeHref={activeHref}
          items={pageTree}
          onFollow={handleFollow}
        />
      }
      toolsOpen={toc.length > 0}
      toolsWidth={250}
      tools={
        <HelpPanel header={<h2>Table of Contents</h2>}>
          <ul>
            {toc.map(item => (
              <li key={item.id} style={{ marginLeft: `${(item.level - 1) * 15}px`, listStyle: 'none', padding: '2px 0' }}>
                <a href={`#${item.id}`} onClick={(e) => { e.preventDefault(); scrollToTocId(item.id); }} style={{ textDecoration: 'none' }}>{item.text}</a>
              </li>
            ))}
          </ul>
        </HelpPanel>
      }
      content={
        <ContentLayout header={<Header variant="h1">Confluence Viewer</Header>}>
          <Container>
            {loading ? <Spinner /> : <div dangerouslySetInnerHTML={{ __html: pageContent }} />}
          </Container>
        </ContentLayout>
      }
    />
  );
};

export default ConfluencePage;
