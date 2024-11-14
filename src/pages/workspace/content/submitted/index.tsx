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
import { DataType } from 'ka-table/enums';
import KaTableComponent from "@/components/KaTableComponent";
import { timeAgo } from "@/utils/Helper";
const columns = [
  { key: 'title_and_description', title: 'Title & Description', dataType: DataType.String },
  { key: 'contentType', title: 'Content Type', dataType: DataType.String },
  { key: 'status', title: 'Status', dataType: DataType.String },
  { key: 'lastUpdatedOn', title: 'Last Modified', dataType: DataType.String },
  { key: 'action', title: 'Action', dataType: DataType.String },


]
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
  const [data, setData] = React.useState<any[]>([]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);
  useEffect(() => {
    const filteredArray = contentList.map((item: any) => ({
      image: item?.appIcon,

      name: item?.name,
      description: item?.description,

      contentType: item.primaryCategory,
      lastUpdatedOn: timeAgo(item.lastUpdatedOn),
      status: item.status,
      identifier: item.identifier,
      mimeType: item.mimeType,
      mode: item.mode
    }));
    setData(filteredArray)
    console.log(filteredArray)
  }, [contentList]);
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
        <Box sx={{ background: "#fff", borderRadius: '8px', boxShadow: "0px 2px 6px 2px #00000026", pb: '15px' }}>
          <Box p={2}>
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
            <Box className="table-ka-container">
              <KaTableComponent columns={columns} data={data} tableTitle="submitted" handleDelete={handleDelete} />
            </Box>
          ) : (
            <NoDataFound />
          )}





          {totalCount > LIMIT && (
            <PaginationComponent
              count={Math.ceil(totalCount / LIMIT)}
              page={page}
              onPageChange={(event, newPage) => setPage(newPage - 1)}
            />
          )}
        </Box>
      </Box>
    </Layout>
  );
};

export default SubmittedForReviewPage;
