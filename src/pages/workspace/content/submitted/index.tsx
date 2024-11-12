import React, { useEffect, useState } from "react";
import Layout from "../../../../components/Layout";
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { getContent } from "@/services/ContentService";
import SearchBox from "../../../../components/SearchBox";
import PaginationComponent from "@/components/PaginationComponent";
import NoDataFound from "@/components/NoDataFound";
import { LIMIT } from "@/utils/app.constant";
import { MIME_TYPE } from "@/utils/app.config";
import router from "next/router";
import WorkspaceText from "@/components/WorkspaceText";

const SubmittedForReviewPage = () => {
  const [selectedKey, setSelectedKey] = useState("submitted");
  const [filter, setFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("updated");
  const [searchTerm, setSearchTerm] = useState("");
  const [contentList, setContentList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [contentDeleted, setContentDeleted] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const handleSearch = (search: string) => {
    setSearchTerm(search.toLowerCase());
  };

  const handleFilterChange = (filter: string[]) => {
    setFilter(filter);
  };

  const handleSortChange = (sortBy: string) => {
    setSortBy(sortBy);
  };

  const handleDelete = (index: number) => {
    console.log(`Deleting item at index ${index}`);
    setContentDeleted((prev) => !prev);
  };

  useEffect(() => {
    const getReviewContentList = async () => {
      try {
        setLoading(true);
        const query = debouncedSearchTerm || "";
        const offset = page * LIMIT;
        const primaryCategory = filter.length ? filter : [];
        const order = sortBy === "Created On" ? "asc" : "desc";
        const sort_by = { lastUpdatedOn: order };
        const response = await getContent(
          ["Review", "FlagReview"],
          query,
          LIMIT,
          offset,
          primaryCategory,
          sort_by
        );
        const contentList = (response?.content || []).concat(
          response?.QuestionSet || []
        );
        setContentList(contentList);
        setTotalCount(response?.count);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    getReviewContentList();
  }, [debouncedSearchTerm, filter, sortBy, contentDeleted, page]);

  const openEditor = (content: any) => {
    const identifier = content?.identifier;
    const mode = "review";
    if (content?.mimeType === MIME_TYPE.QUESTIONSET_MIME_TYPE) {
      router.push({ pathname: `/editor`, query: { identifier, mode } });
    } else if (
      content?.mimeType &&
      MIME_TYPE.GENERIC_MIME_TYPE.includes(content?.mimeType)
    ) {
      router.push({
        pathname: `/workspace/content/review`,
        query: { identifier, mode },
      });
    } else if (
      content?.mimeType &&
      MIME_TYPE.COLLECTION_MIME_TYPE.includes(content?.mimeType)
    ) {
      router.push({ pathname: `/collection`, query: { identifier, mode } });
    }
  };

  return (
    <Layout selectedKey={selectedKey} onSelect={setSelectedKey}>
      <WorkspaceText />
      <Box p={3}>
        <Box sx={{ background: "#FFFFFF" }} p={2}>
          <Typography
            variant="h4"
            sx={{ fontWeight: "bold", fontSize: "16px" }}
          >
            Submitted For Review
          </Typography>
        </Box>
        {/* <Typography mb={2}>
          Here you can see all your content submitted for review.
        </Typography> */}

        <Box mb={3}>
          <SearchBox
            placeholder="Search by title..."
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            onSortChange={handleSortChange}
          />
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" my={5}>
            <CircularProgress />
          </Box>
        ) : contentList && contentList.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead style={{ backgroundColor: "#F8EFE7" }}>
                <TableRow>
                  <TableCell>Title & Description</TableCell>
                  <TableCell>Content Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Modified</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contentList.map((content: any, index) => (
                  <TableRow
                    key={content.identifier}
                    hover
                    style={{ cursor: "pointer" }}
                  >
                    <TableCell onClick={() => openEditor(content)}>
                      <Box display="flex" alignItems="center">
                        <img
                          src={content?.appIcon || "/logo.png"}
                          alt={content?.name}
                          style={{
                            width: 60,
                            height: 40,
                            borderRadius: "8px",
                            marginRight: "10px",
                          }}
                        />
                        <Box>
                          <Typography variant="subtitle1" noWrap>
                            {content.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                          >
                            {content.description}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{content.primaryCategory}</TableCell>
                    <TableCell sx={{ color: "#BA1A1A" }}>
                      {content.status}
                    </TableCell>
                    <TableCell>
                      {new Date(content.lastUpdatedOn).toLocaleString()}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={() => handleDelete(index)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <NoDataFound />
        )}

        {totalCount > LIMIT && (
          <PaginationComponent
            count={Math.ceil(totalCount / LIMIT)}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
          />
        )}
      </Box>
    </Layout>
  );
};

export default SubmittedForReviewPage;
